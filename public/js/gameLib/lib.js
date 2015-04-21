function has(v){
	return (typeof v !== 'undefined');
}
function test(v,d){
	return has(v)?v:d;
}
function round(v){
	return ~~(v+0.5);
}