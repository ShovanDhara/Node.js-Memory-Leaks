# Introduction

Memory leaks are like parasites of an application, they creep up into your systems unnoticed and don't cause any harm initially, but once leaks are strong enough they can cause catastrophic problems to your application such as high latencies and crashes. In this article we will look at what are memory leaks, how javascript manages memory, how to identify leaks in a real world scenario and eventually how to fix them.

Attach file will cause the Leak. Go through the instruction to debug and resolve the Leak.


## Introducing a Leaky Code

For the sake of demo, I have a built an express server which has a leaky route in it. We will use this API server for debugging.
```
const express = require('express')
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```
Here we have a leaks array which is outside the scope of our API and hence each time this is called, it will keep pushing data to that array without ever cleaning it. Since it will always be referenced, the GC will never release the memory taken up by it.

## Heapdump 
But first lets look at how to take a heapdump. We will use an npm library heapdump which allows us to take a heapdump of the server programmatically. To install do :

Run `npm i heapdump`.

## Identifying the Leak

So now our server is deployed and has been running for days. Its being hit by a number of request (only one in our case) and we have observed that the memory consumption of our server has spiked (you can do so using monitoring tools like Express Status Monitor, Clinic, Prometheus). We will now make the API call to take a heapdump. This heapdump will contains all the objects which GC wasn't able to collect.

`curl --location --request GET 'http://localhost:3000/heapdump'`

Taking a heapdump forces GC to trigger and hence we don't have to worry about memory allocations which might be collected GC in future but are currently inside heap i.e. non leaky objects.

Open up chrome and hit F12. This will open up chrome console, go to Memory tab and Load both the snapshots.

After loading both the snapshots change the perspective to Comparison and click on the long running server's snapshot

We can go through Constructor and look at all the objects GC didn't sweep. Most of them would be internal reference which nodes uses, one neat trick is to sort them by Alloc. Size to check most heavy memory allocations we have. If we expand array and then expand (object elements) we will be able to see our leaks array containing insane amount of objects in it which is not picked up GC.

## Fixing the Leak

Now that we know array leaks is causing the trouble, we can look at the code and pretty easily debug that its because the array is outside the scope of request cycle and hence its reference is never deleted. We can fix it fairly easily by doing :
```
app.get('/bloatMyServer', (req, res) => {
	const redundantObj = {
		memory: "leaked",
		joke: "meta"
	};

	const leaks = [];

	[...Array(10000)].map(i => leaks.push(redundantObj));

	res.status(200).send({size: leaks.length})
});
```

We can verify this fix by repeating the above steps and comparing snapshots again.