const express = require('express');
const heapdump = require("heapdump");

const app = express();
const port = 3000;

const leaks = [];

app.get('/bloatMyServer', (req, res) => {
	const redundantObj = {
		memory: "leaked",
		joke: "meta"
	};

	[...Array(10000)].map(i => leaks.push(redundantObj));

	res.status(200).send({size: leaks.length})
});

app.get('/heapdump', (req, res) => {
	heapdump.writeSnapshot(`heapDump-${Date.now()}.heapsnapshot`, (err, filename) => {
		console.log("Heap dump of a bloated server written to", filename);

		res.status(200).send({msg: "successfully took a heap dump"})
	});
});

app.listen(port, () => {
	heapdump.writeSnapshot(`heapDumpAtServerStart.heapsnapshot`, (err, filename) => {
		console.log("Heap dump of a fresh server written to", filename);
	});
});