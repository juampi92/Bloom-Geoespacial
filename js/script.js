(function(){

	// Utiles
	function isNumber(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	}
	window.onbeforeunload = function(){ return "Saliendo"};

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

	Data.prototype.remove = function(){
		
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

		if ( this.$el ) this.$el.remove();

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

	Sector.prototype.remove = function(){
		this.cont.forEach( function(elem) {
			elem.remove();
		});
		this.cont.length = 0; // Borrar el arreglo
		if ( this.$el ) this.$el.remove();
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

		if ( this.$el ) this.$el.remove();

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

	Server.prototype.remove = function(){
		this.sectors.forEach( function(elem) {
			elem.remove();
		});
		this.sectors.length = 0; // Borrar arreglo
		if ( this.$el) this.$el.remove();
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

	BloomFilter.prototype.remove = function(){
		this.bools.length = 0;
		this.values.length = 0;
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
		//this.bloomf.render(this.server);
	}

	BloomServer.prototype.remove = function(){
		this.server.remove();
		this.bloomf.remove();
	}

	// Simulacion

	var $modals = $('#modals'),
	
	// Visual
	Servidores = {
		$modal: null,
		input: { $cant: null , $filtro: null , $send: null },
		servers: new Array(),
		init: function(){
			this.$modal = $modals.children('#newServer');
			this.$modal.modal({keyboard: true, show:false});
			this.input.$cant = this.$modal.find('input[name="cant"]');
			this.input.$filtro = this.$modal.find('input[name="filtro"]');
			this.input.$send = this.$modal.find('.modal-footer button');

			this.onClickEvents();
		},
		getServer: function(id){
			return this.servers[id];
		},
		onClickEvents: function(){
			var self = this;

			this.$modal.on('shown.bs.modal', function(e){ self.input.$cant.focus(); });

			$('button[role="addServer"]').click(function(){
				self.popUp();
			});
			this.input.$send.on('click',function(e){
				e.preventDefault();
				if ( self.validate() ) {
					self.addServers();
					self.popDown();
				}
			});
		},
		popUp: function(){
			this.$modal.modal('show');
			this.input.$cant.val('');
			this.input.$filtro.val(15);
		},
		popDown: function(){
			this.$modal.modal('hide');
		},
		validate: function(){
			var success = true;
			if ( !isNumber(this.input.$cant.val()) ) {
				success = false;
				this.input.$cant.parent().addClass('has-error');
			} else
				this.input.$cant.parent().addClass('has-success');

			if ( !isNumber(this.input.$filtro.val()) || 
				parseInt(this.input.$filtro.val()) > 20 ||
				parseInt(this.input.$filtro.val()) < 10
			) {
				success = false;
				this.input.$filtro.parent().addClass('has-error');
			} else {
				this.input.$filtro.parent().addClass('has-success');
			}

			return success;
		},
		addServers: function(){
			var filterSize = parseInt(this.input.$filtro.val());
			for (var i = 0; i < parseInt(this.input.$cant.val()); i++) {
				var server = new Server(),
					filtro = new BloomFilter(filterSize),
					bloomServer = new BloomServer( server , filtro );
				this.servers[server.id] = bloomServer;
				bloomServer.render();
			};
		},
		render: function(){
			Server.$parent.empty();
			this.servers.forEach(function(elem){
				elem.render();
			});
		}
	};
	Servidores.init();

	// Listeners
	(function(){
		// Acordeon
		$('ul#servers').on('click','button[role="acordeon"]',function(){
			var $this = $(this),
				$icon = $this.children('span'),
				$cont = $this.parent().parent().parent().parent().next(),
				toggleOff = $cont.is(':hidden');

			if ( toggleOff ){
				// Lo activamos:
				$icon.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
				$cont.slideDown('slow');
			} else {
				// Lo desactivamos
				$icon.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
				$cont.slideUp('slow');
			}
		});

		$('ul#servers').on('click','ul.dropdown-menu li',function(e) {
			var $this = $(this);
		    if ( $this.hasClass("hiddenButton") ) {
		    	e.stopPropagation();			    
			    if ( !$this.hasClass('active') ) {
			    	$this.addClass('active');
			    	$this.children('input').val('').focus();
			    	$this.removeClass("has-error");
			    }	
		    } else {
		    	console.log($this.html());
		    }
		});

		$('ul#servers').on('keypress','input',function(e) {
		    if(e.which == 13) {
			    e.preventDefault();
			    var $this = $(this);
			    switch ( $this.data('tipo') ){
			    	case "newSector":
			    		if ( $this.val() != '' &&
			    			 isNumber($this.val()) &&
			    			 parseInt($this.val()) > 0
			    			) 
			    		{
				    		$this.parent().removeClass('active');
				    		var bloomSrvr = Servidores.getServer( parseInt($this.data('id')) ),
				    			srvr = bloomSrvr.server,
				    			sector = new Sector( parseInt( $this.val() ) , srvr );
				    		bloomSrvr.addSector(sector);
				    		sector.render();
				    	} else {
				    		$this.parent().addClass("has-error");
				    	}
			    	break;
			    }
			}
		});
	})();

})();