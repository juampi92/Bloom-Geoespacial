(function(){

	//----------------------------------------------
	// DATO
	//----------------------------------------------
	function Data(key, value, size){
		this.key = key;
		this.value = value;
		this.size = size;
	}

	Data.prototype.render = function(){
		
	}

	//----------------------------------------------
	// SECTOR
	//----------------------------------------------
	Sector.ultimoid = 0; // ID GENERATOR
	function Sector(size , server) {
		this.id = Sector.ultimoid++;
		this.name = server.sectors.length+1;
		this.size = size;
		this.free = size;
		this.server = server;
		this.cont = new Array();
		this.$el = null;
		this.$parent = null;
		this.$data = null;
	}

	Sector.template = $('#template-sector').html();
	Sector.tag = '<li></li>';
	Server.tag_data = 'ul.data';

	Sector.prototype.write = function(data) {
		if ((this.read(data.key) === false) && (this.free >= data.size)) {
			this.cont.push(data);
			this.free = this.free - data.size;
			return true;
		}
		return false;
	}

	Sector.prototype.read = function(key) {
		for (i=0; i < this.cont.length; i++) {
			if (this.cont[i].key == key)
				return (this.cont[i])
		}
		return false;
	}

	Sector.prototype.getFull = function(){
		return  (((this.size-this.free) / this.size)*100).toFixed(1);
	}

	Sector.prototype.render = function(){
		var self = this;

		this.$parent = this.server.$sectores;

		this.$el = $(Sector.tag);
		this.$parent.append(this.$el);

		var template = _.template( Sector.template , {id:this.id , name:this.name , porcentaje:this.getFull()} );
		this.$el.html( template );

		this.$data = this.$el.find( Sector.tag_data );

		this.cont.forEach( function(elem) {
			//elem.render();
		});
	}

	//----------------------------------------------
	// SERVIDOR SIMPLE
	//----------------------------------------------
	Server.ultimoid = 0; // ID GENERATOR
	function Server(sectors) {
		this.sectors = new Array();
		if ( sectors ) this.sectors = _.union( this.sectors , sectors );
		this.id = Server.ultimoid++;
		this.$el = null;
		this.$filtro = null;
		this.$sectores = null;
	}

	// Variables estáticas de la clase
	Server.template = $('#template-server').html();
	Server.tag = '<li></li>';
	Server.$parent = $('ul#servers');
	Server.tag_filtro = '.filtroBloom';
	Server.tag_sectores = 'ul.sectores';

	Server.prototype.addSector = function(sector) {
		this.sectors.push(sector);
	}

	Server.prototype.removeSector = function(id) {
		for (i=0; i < this.sectors.length; i++) {
			if (this.sectors[i].id == id)
				this.sectors.splice(i,1);
		}
	}

	Server.prototype.write = function(data) {
		if (this.read(data.key) === false)
			for (i=0; i < this.sectors.length; i++)
				if (this.sector[i].write(data))
					return true;
		return false;
	}

	Server.prototype.read = function(key) {
		for (i=0; i < this.sectors.length; i++) {
			var data = this.sectors[i].read(key);
			if ( data != false)
				return data;
		}
		return false;
	}

	//Server.prototype.get

	Server.prototype.render = function(){
		var self = this;

		this.$el = $(Server.tag);
		Server.$parent.append(this.$el);
		
		var template = _.template( Server.template , {id:this.id , name:this.id+1} );
		this.$el.html( template );

		this.$filtro = this.$el.find( Server.tag_filtro );
		this.$sectores = this.$el.find( Server.tag_sectores );

		this.sectors.forEach( function(elem) {
			elem.render();
		});
	}

	//----------------------------------------------
	// FUNCION DE HASH - MURMUR
	//----------------------------------------------
	function murmur(str, seed) {
	  var m = 0x5bd1e995;
	  var r = 24;
	  var h = seed ^ str.length;
	  var length = str.length;
	  var currentIndex = 0;
	  
	  while (length >= 4) {
	    var k = UInt32(str, currentIndex);
	    
	    k = Umul32(k, m);
	    k ^= k >>> r;
	    k = Umul32(k, m);
	 
	    h = Umul32(h, m);
	    h ^= k;
	 
	    currentIndex += 4;
	    length -= 4;
	  }
	  
	  switch (length) {
	  case 3:
	    h ^= UInt16(str, currentIndex);
	    h ^= str.charCodeAt(currentIndex + 2) << 16;
	    h = Umul32(h, m);
	    break;
	    
	  case 2:
	    h ^= UInt16(str, currentIndex);
	    h = Umul32(h, m);
	    break;
	    
	  case 1:
	    h ^= str.charCodeAt(currentIndex);
	    h = Umul32(h, m);
	    break;
	  }
	 
	  h ^= h >>> 13;
	  h = Umul32(h, m);
	  h ^= h >>> 15;
	 
	  return h >>> 0;
	}
	 
	function UInt32(str, pos) {
	  return (str.charCodeAt(pos++)) +
	         (str.charCodeAt(pos++) << 8) +
	         (str.charCodeAt(pos++) << 16) +
	         (str.charCodeAt(pos) << 24);
	}
	 
	function UInt16(str, pos) {
	  return (str.charCodeAt(pos++)) +
	         (str.charCodeAt(pos++) << 8);
	}
	 
	function Umul32(n, m) {
	  n = n | 0;
	  m = m | 0;
	  var nlo = n & 0xffff;
	  var nhi = n >>> 16;
	  var res = ((nlo * m) + (((nhi * m) & 0xffff) << 16)) | 0;
	  return res;
	}
	 
	function getBucket(str, buckets) {
	  var hash = doHash(str, str.length);
	  var bucket = hash % buckets;
	  return bucket;
	}

	//----------------------------------------------
	// FUNCION DE HASH - FNV1S
	//----------------------------------------------
	function fnv1s(str) {
	  var bytes = stringToBytes(str);
	  var hash = FNVINIT;
	  for (var i=0; i < bytes.length; i++) {
	    hash *= FNVPRIME;
	    hash ^= bytes[i];
	  }
	  return Math.abs(hash);
	}

	var FNVPRIME = 0x01000193;
	var FNVINIT = 0x811c9dc5;

	function stringToBytes(str) {
	  var ch, st, re = [];
	  for (var i = 0; i < str.length; i++) {
	    ch = str.charCodeAt(i); 
	    st = [];
	    do {
	      st.push( ch & 0xFF );
	      ch = ch >> 8;
	    }
	    while ( ch );
	    re = re.concat( st.reverse() );
	  }
	  return re;
	}

	//----------------------------------------------
	// BLOOM FILTER
	//----------------------------------------------
	function BloomFilter(size) {
		this.size = size;
		this.bools = new Array();
		this.values = new Array();
		for (var i = 0; i < size; i++) {
			this.bools[i] = false;
			this.values[i] = 0;
		}
	}

	BloomFilter.prototype.insert = function (key) {
		var v1 = fnv1s(key) % this.size;
		var v2 = murmur(key) % this.size;
		this.bools[v1] = this.bools[v2] = 1;
		this.values[v1]++;
		this.values[v2]++;
	}

	BloomFilter.prototype.contains = function (key) {
		var v1 = fnv1s(key) % this.size;
		var v2 = murmur(key) % this.size;
		return (this.bools[v1] && this.bools[v2]);
	}

	BloomFilter.prototype.del = function (key) {
		var v1 = fnv1s(key) % this.size;
		var v2 = murmur(key) % this.size;
		this.values[v1]--;
		this.values[v2]--;
		if (this.values[v1] == 0)
			this.bools[v1] = false;
		if (this.values[v2] == 0)
			this.bools[v2] = false;
	}

	BloomFilter.prototype.render = function(){
		
	}

	//----------------------------------------------
	// SERVIDOR CON FILTRO BLOOM
	//----------------------------------------------

	function BloomServer(server, bloomf) {
		this.server = server;
		this.bloomf = bloomf;
	}

	BloomServer.prototype.write = function(data) {
		if (this.bloomf.contains(data.key) == false) {
			if (this.server.write(data)) {
				this.bloomf.insert(data.key);
				return true;
			}
		}
		return false;
	}

	BloomServer.prototype.read = function(key) {
		if (this.bloomf.contains(key))
			return this.server.read(key);
		return false;
	}

	BloomServer.prototype.addSector = function(sector) {
		this.server.addSector(sector);
	}

	BloomServer.prototype.removeSector = function(id) {
		this.server.removeSector(id);
	}

	BloomServer.prototype.render = function(){
		this.server.render();
	}


	// Ejecución test:
	var srvr = new Server();
	var bloom = new BloomFilter(10);
	var bloomSrvr = new BloomServer(srvr , bloom );

	bloomSrvr.addSector( new Sector(10 , srvr) );
	bloomSrvr.addSector( new Sector(15 , srvr) );
	bloomSrvr.addSector( new Sector(20 , srvr) );

	var data = new Data("juan",3,5);
	srvr.sectors[1].write(data);

	bloomSrvr.render();

})();