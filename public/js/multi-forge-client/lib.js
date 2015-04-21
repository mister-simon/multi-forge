function has(v){
	return (typeof v !== 'undefined');
}
function test(v,d){
	return has(v)?v:d;
}
function getArgs(args){
	var argsOut = [];
	for(var i=0, l=args.length; i<l; i++){
		argsOut.push(args[i]);
	}
	return argsOut;
}