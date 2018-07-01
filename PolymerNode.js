var net = require('net');
var sha=require("js-sha256");
var fs = require('fs');
//Polymer (Atom-Chain) V0.0.0.0
MYID=Math.round(Math.random()*10000);
function block(data,prevhash=chain[index-1].hash)
{
	this.index=++index;
	this.timestamp=new Date().getTime()/1000;
	this.prevhash=prevhash;
	this.data=data;
	this.hash=sha.sha256(data).toString();
}

function valid(block)
{
	return (block.index==index+1)&&(sha.sha256(block.data).toString()==block.hash)&&(block.prevhash=chain[index].hash);
}

var index=-1;
var chain=[new block("Starting chain",0)];

peers=[]

//Server
function broadcast(data,skip=[])
{
	console.log("Broadcasting update:\r\n"+data);
	var keys=Object.keys(peers);
	for(var i=0;i<keys.length;i++)
	{
		if(skip.indexOf(keys[i])==-1)
			peers[keys[i]].write(data);
	}
}

console.log("Starting Polymer Node\r\nID:"+MYID);
var server = net.createServer(function(socket) {
	console.log("New Connection.");
	socket.name=socket.remoteAddress;
	socket.ID=Math.random();
	peers[socket.name]=socket;
	connection(socket.name);
	socket.write(socket.name+"&"+JSON.stringify(Object.keys(peers)));
	broadcast(socket.name,[socket.name]);
	var state=0;
	socket.on('data',(data)=>
	{
		switch(state)
		{
			case 0:
			
			if(data=="SC")
			{
				console.log("Transferring blockchain to "+socket.name+" ["+socket.ID+"]");
				socket.write(JSON.stringify(chain));
				state=1;
			}
			
			break;
			case 1:
			console.log("Block received from ("+socket.name+" ["+socket.ID+"]):\r\n"+data);
			var b=JSON.parse(data);
			if(valid(b))chain.push(b);
			else
			{
				console.log("Invalid block. Ignoring.");
				return;
			}
			index++;
			console.log("Valid block. Broadcasting");
			broadcast(JSON.stringify(chain));
			fs.writeFile("blockchain"+MYID+".bc", JSON.stringify(chain), function(err) {
				if(err) {
					return console.log(err);
				}
			
				console.log("Blockchain image saved.");
			});
			
			break;
		}
	});
	socket.on('error',(data)=>{console.log("Peer connection failed suddenly. Eliminating.");peers[socket.name]=undefined;});
});

//Client
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function checkchain(ch)
{
	if(ch.length<index)return false;
	return (ch[index].hash==chain[index].hash)||(ch[index].timestamp<=chain[index].timestamp);
}
var clientconn=[]
function connection(ip=false)
{
	var client = new net.Socket();
	if(!ip)
	{
		rl.question('IP:\r\n', (ip) => {
			client.connect(80, ip, function() {
				console.log('Client Connected to main entrance node');
			});
		});
	}
	else client.connect(80, ip, function() {
				console.log('Client Connected to new peer');
			});
	var state=0;
	client.on('data', function(data) {
		switch(state)
		{
			case 0:
				var pe=JSON.parse(data.substring(data.indexOf("&")+1,data.length));
				var me=data.split("&")[0];
				for(var i=0;i<pe.length;i++)
				{
					if(pe[i]!=me&&clientconn.indexOf(pe[i])==-1)
					{
						clientconn.push(pe[i]);
						connection(pe[i]);
					}
				}
			break;
			case 1:
			console.log('Blockchain update');
			nchain=JSON.parse(data);
			if(checkchain(nchain))
				chain=nchain;
			else
			{
				console.log("Invalid chain received. Broadcasting correction.");
				broadcast(chain);
				return;
			}
			index=chain.length;
			rl.question('Data:\r\n', (data) => {
				console.log('Block created. Sending to polymer');
				bl=JSON.stringify(new block(data));
				console.log("Sending block:\r\n"+bl);
				client.write(bl);
			});
			break;
		}
	});
	
	client.on('close', function() {
		console.log('Connection closed');
	});
}
server.listen(80, '127.0.0.1');
if(!process.argv[2])connection();