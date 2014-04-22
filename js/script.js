(function(){

	var $eventos = $('body');
	
	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------
	//---------------------CLASES, OBJETOS Y FUNCIONES--------------------------
	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------

	//----------------------------------------------
	// RECORD
	//----------------------------------------------
	
	function Record(key, value){
		this.key = key;
		this.value = value;
	}

	//----------------------------------------------
	// FILE
	//----------------------------------------------

	function File(records, table) {
		this.cont = new Array();
		this.tablename = table;
		this.size = records;
		for (var index = 0; index < this.size; index++) {
			this.cont.push(new Record(index,""));
		}
		this.visual();	
	}

	File.prototype.read = function(key) {
		if (this.contains(key)) {
			var index = 0;
			while (this.cont[index].key != key) { index++; }
			return this.cont[index].value;
		}
		return null;
	}

	File.prototype.insert = function(data) {
		// PARTE LOGICA
		if (this.contains(data.key)) {
			var index = 0;
			while (this.cont[index].key != data.key) { 
				index++;
			}
			this.cont[index].value = data.value;
		}
		else {
			this.cont.push(data);
			this.size++;
		}

		// PARTE VISUAL
		var fila = document.getElementById(this.tablename+data.key);
		if (fila != null) { 
			$(fila).empty(); 
		}
		else { 
			fila = document.createElement("tr");
			fila.id = this.tablename+data.key;
			document.getElementById(this.tablename).appendChild(fila);
		}
		var key = document.createElement("td");
		var value = document.createElement("td");
		key.className = "datacell";
		value.className = "datacell";
		key.innerHTML = data.key;
		value.innerHTML = data.value;
		fila.appendChild(key);
		fila.appendChild(value);

		// SCROLLEAR
		var toggle = $("#"+this.tablename+"-toggle");
		toggle.click();	
	}

	File.prototype.contains = function (key) {
		for (var index = 0; index < this.size; index++) {
			if (this.cont[index].key == key) { 
				return true; 
			}
		}
		return false;
	}

	File.prototype.emtpy = function (key) {
		if (this.contains(key)) {
			return (this.read(key) == "")
		}
		return false;
	}

	File.prototype.delete = function (key) {
		this.insert(new Record(key,""));
	}

	File.prototype.reorganize = function (diffile) {
		for (var index = 0; index < diffile.cont.length; index++) {
			this.insert(diffile.cont[index]);
		}
		diffile.clear(0);
	}

	File.prototype.clear = function(records) {
		this.cont.splice(0, this.cont.length);
		this.size = records;
		for (var index = 0; index < this.size; index++) {
			this.cont.push(new Record(index,""));
		}
		this.visual();
	}

	File.prototype.visual = function () {
		var table = document.getElementById(this.tablename);

		$(table).empty();

		var clave = document.createElement("th");
		var valor = document.createElement("th");
		clave.innerHTML = "Clave";
		valor.innerHTML = "Valor";
		clave.className = "datacell";
		valor.className = "datacell";
		var cabezera = document.createElement("tr");
		cabezera.className = "datarow";
		cabezera.appendChild(clave);
		cabezera.appendChild(valor);
		table.appendChild(cabezera);

		for (var index = 0; index < this.cont.length; index++) {
			var fila = document.createElement("tr");
			var key = document.createElement("td");
			var value = document.createElement("td");
			fila.id = this.tablename+this.cont[index].key;
			fila.className = "datarow";
			key.className = "datacell";
			value.className = "datacell";
			fila.appendChild(key);
			fila.appendChild(value);
			table.appendChild(fila);
			key.innerHTML = this.cont[index].key;
			value.innerHTML = this.cont[index].value;
		}
	}

	File.prototype.iluminate = function(key) {
		if (key != this.iluminated) {
			this.desiluminate();
			if (this.contains(key)) {
				this.ilumined = key;
				var fila = $("#"+this.tablename+key);
				(fila.children()).addClass('iluminate');
				var toggle = $("#"+this.tablename+"-toggle");
				toggle.click();
				// SCROLLEAR
				var pos = key-5; if (pos < 0) pos = "";
				$("#bloom-tabs-cont").scrollTo("#"+this.tablename+pos,800);
			}
		}
	}

	File.prototype.desiluminate = function() {
		if (this.ilumined != null) {
			var fila = $("#"+this.tablename+this.ilumined);
			(fila.children()).removeClass('iluminate');
			this.ilumined = null;
		}
	}

	//----------------------------------------------
	// BLOOM FILTER
	//----------------------------------------------
	
	function BloomFilter(size) {
		this.bools = new Array();
		this.clear(size);
	}

	BloomFilter.$el = $('#tab-bloom > #mid-col');
	BloomFilter.$els = {
		$bools: BloomFilter.$el.find('table tr:eq(0)'),
		$txt: BloomFilter.$el.find('p')
	};

	BloomFilter.prototype.insert = function (key) {
		// PARTE LOGICA
		var v1 = fnv1s(key) % this.size;
		var v2 = murmur(key) % this.size;
		this.bools[v1] = this.bools[v2] = 1;
		this.cant++;

		// PARTE VISUAL
		BloomFilter.$els.$bools.find('td[_id='+v1+']').addClass("true");
		BloomFilter.$els.$bools.find('td[_id='+v2+']').addClass("true");

		var m = document.getElementById("tammain");
		var d = document.getElementById("tamdif");
		var u = document.getElementById("regunused");
		var o = document.getElementById("ocupado");
		var f = document.getElementById("falsopositivo");
		
		m.innerHTML = main.size;
		d.innerHTML = diff.size;
		u.innerHTML = Math.round(100*(main.size - diff.size)/main.size) + "%";
		
		var total = 0;
		for (var i = 0; i < this.size; i++) {
			if (this.bools[i]) { total++;}
		}
		var usedbits = total/this.size;
		o.innerHTML = Math.round(100*(usedbits)) + "%";
		
		var unusedrecord = (main.size - diff.size) / main.size;
		var prob = Math.round(100*(unusedrecord*Math.pow(usedbits,2)));
		f.innerHTML = prob + "%";
	}

	BloomFilter.prototype.contains = function (key) {
		var v1 = fnv1s(key) % this.size;
		var v2 = murmur(key) % this.size;
		return (this.bools[v1] && this.bools[v2]);
	}

	BloomFilter.prototype.evaluate = function(key) {
		var values = new Array();
		values[0] = murmur(key)%this.size;
		values[1] = fnv1s(key)%this.size;
		return values;
	}

	BloomFilter.prototype.clear = function(size) {
		this.bools.splice(0, this.bools.length);
		this.size = size;
		for (var index = 0; index < this.size; index++) {
			this.bools[index] = false;
		}
		this.cant = 0;
		this.ilumined = null;
		this.visual();
	}

	BloomFilter.prototype.visual = function() {
		// Ancho en % de cada casilla
		var rowbool = document.getElementById("bloomboleans");

		// Existen los arreglos, asi que borro sus hijos
		BloomFilter.$els.$bools.empty();
		
		for (var i=0; i < this.size ; i++) {
			var $td_bool = $('<td></td>');

			$td_bool.attr("_id",i);

			if (this.bools[i])
				$td_bool.addClass("true");
			else
				$td_bool.addClass("false");

			BloomFilter.$els.$bools.append($td_bool);
		}
		var contenedores = {
			m: document.getElementById("tammain"),
			d: document.getElementById("tamdif"),
			u: document.getElementById("regunused"),
			o: document.getElementById("ocupado"),
			f: document.getElementById("falsopositivo")
		};
		
		contenedores.m.innerHTML = main.size;
		contenedores.d.innerHTML = diff.size;
		contenedores.u.innerHTML = "100%";
		contenedores.o.innerHTML = "0%";
		contenedores.f.innerHTML = "0%";
	}

	BloomFilter.prototype.iluminate = function(key) {
		if (key != this.ilumined) {
			this.desiluminate();
			this.ilumined = key;
			if (key != "") {
				var values = this.evaluate(key);
				BloomFilter.$els.$bools.find('td[_id='+values[0]+']').addClass("iluminate");
				BloomFilter.$els.$bools.find('td[_id='+values[1]+']').addClass("iluminate");
				
				var t1 = document.getElementById("h1");
				var t2 = document.getElementById("h2");
				t1.innerHTML = values[0];
				t2.innerHTML = values[1];

				var r = document.getElementById("resultado");
				r.style.color = "#199B9B";

				if (!this.contains(key)) {
					r.innerHTML = "Negativo";
				}
				else if (diff.contains(key)) {
					r.innerHTML = "Positivo";
				}
				else {
					r.innerHTML = "Falso Positivo";
					r.style.color = "red";
				}
			}
		}
	}

	BloomFilter.prototype.desiluminate = function() {
		if (this.ilumined != null) {
			var values = this.evaluate(this.ilumined);
			this.ilumined = null;
			BloomFilter.$els.$bools.find('td[_id='+values[0]+']').removeClass("iluminate");
			BloomFilter.$els.$bools.find('td[_id='+values[1]+']').removeClass("iluminate");
			var t1 = document.getElementById("h1");
			var t2 = document.getElementById("h2");
			var r = document.getElementById("resultado");
			t1.innerHTML = "";
			t2.innerHTML = "";
			r.innerHTML = "";
		}
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

	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------
	//-----------------------COMPORTAMIENTOS DE BLOOM---------------------------
	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------

	// FUNCIONES
	function enrango(id) {
		var input = $("#"+id);
		var valor = input.val();
		if ((!($.isNumeric( valor ))) || (valor < 0) || (valor >= main.size)) {
			input.removeClass("valid");
			input.addClass("invalid");
			return false;
		}
		input.removeClass("invalid");
		input.addClass("valid");
		return true;
	}

	function reset(id) {
		var input = $("#"+id);
		$(input).val("");
		input.removeClass("valid");
		input.removeClass("invalid");
	}

	function desiluminar() {
		main.desiluminate();
		diff.desiluminate();
		bloom.desiluminate();
	}

	function insertkeyinput() {
		reset("readkey");
		reset("deletkey");
		reset("outvalue");

		var key = $("#insertkey").val();

		if (enrango("insertkey")) {
			bloom.iluminate(key);
			if (diff.contains(key)) { diff.iluminate(key); }
			else { main.iluminate(key); }
		}
		else {
			desiluminar();
			if (key == "") { reset("insertkey"); }
		}
	}

	function insertvalueinput() {
		reset("readkey");
		reset("deletkey");
		reset("outvalue");

		var key = $("#insertkey").val();
		if (key == "") { desiluminar(); }

		var value = $("#insertvalue").val();
		if (value != "") { $("#insertvalue").addClass("valid") }
		else { $("#insertvalue").removeClass("valid") }
	}

	function readkeyinput() {
		reset("insertkey");
		reset("deletkey");
		reset("outvalue");
		reset("insertvalue");

		var key = $("#readkey").val();
		
		if (enrango("readkey")) {
			bloom.iluminate(key);
			if (diff.contains(key)) {
				diff.iluminate(key);
				var value = diff.read(key);
				if (value != "") {$("#outvalue").val('"'+value+'"'); }
				else { $("#outvalue").val('VACIO'); }
				}
			else {
				main.iluminate(key);
				var value = main.read(key);
				if (value != "") { $("#outvalue").val('"'+value+'"'); }
				else { $("#outvalue").val('VACIO'); } 
			}
		}
		else {
			desiluminar();	
			if (key == "") { reset("readkey"); }
		}
	}

	function deletkeyinput() {
		reset("insertkey");
		reset("readkey");
		reset("outvalue");
		reset("insertvalue");

		var key = $("#deletkey").val();

		if (enrango("deletkey")) {
			bloom.iluminate(key);
			if (diff.contains(key)) { diff.iluminate(key); }				
			else { main.iluminate(key); }
		}
		else {
			desiluminar();
			if (key == "") { reset("deletkey"); }
		}
	}

	// VARIABLES
	var main = new File(100,"mainfile");
	var diff = new File(0,"diffile");
	var bloom = new BloomFilter(19);

	// LISTENERS
	(function(){

		$("#insertkey").on("change", function() {
  			insertkeyinput();
		});

		$("#insertkey").keyup(function(){
			insertkeyinput();
		});

		$("#insertvalue").keyup(function(){
			insertvalueinput();
		});

		$("#insertvalue").on("change", function() {
  			insertvalueinput();
		});

		$("#readkey").keyup(function(){
			readkeyinput();
		});

		$("#readkey").on("change", function() {
  			readkeyinput();
		});

		$("#deletkey").keyup(function(){
			deletkeyinput();
		});

		$("#deletkey").on("change", function() {
  			deletkeyinput();
		});

		$("#btninsert").on("click", function()  {
			reset("readkey");
			reset("deletkey");
			reset("outvalue");

			var key = $("#insertkey").val();
			var value = $("#insertvalue").val();

			if (enrango("insertkey")) {
				if (value != "") {
					desiluminar();
					reset("insertkey");
					reset("insertvalue");
					diff.insert(new Record(key,value));
					bloom.insert(key);
				}
				else {
					// HACER ---> WARNING DE NO VALOR
				}
			}
			else {
				// HACER ---> WARNING DE KEY INVALIDA
			}
		});

		$("#btndelete").on("click", function()  {
			reset("readkey");
			reset("outvalue");
			reset("insertkey");
			reset("insertvalue");
			
			var key = $("#deletkey").val();
			
			if (enrango("deletkey")) {
				desiluminar();
				reset("deletkey");
				diff.delete(key);
				bloom.insert(key);
			}
			else {
				// HACER ---> WARNING DE KEY INVALIDA
			}
		});

		$("#btnreorganize").on("click", function()  {
			main.desiluminate();
			main.reorganize(diff);
			bloom.clear(19);
		});
		
	})();




	//----------------------------------------------
	// QUADTREE MAP
	//----------------------------------------------

	function getPosition(element) {
	    var xPosition = 0;
	    var yPosition = 0;
	      
	    while (element) {
	        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
	        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
	        element = element.offsetParent;
	    }
	    return { x: xPosition, y: yPosition };
	}

	var Mapa = {
		els: {},
		imagen: {},
		canvas:{},
		precision: 3,
		quads: {
			valores: [],
			agregar: function(indice, elemento){
				var i;
				for (i = 0; i < this.valores.length; i++) {
					var index = ""+this.valores[i][0];
					if ( index.length < indice.length )
						for( var j = 0 ; j < indice.length - index.length ; j++ ) index = index + "0";

					//console.log(indice,index,(indice <= index));
					if ( indice < index ) break;
					if ( indice == index ) { i++; break; }
				};
				this.valores.splice(i, 0,[indice,elemento]);
			},
			buscar: function(sector){
				var out = new Array();
				for (i = 0; i < this.valores.length; i++) {
					var index = ""+this.valores[i][0];
					if ( index.length > sector.length )
						index = index.substr(0,sector.length);

					console.log(index,sector);
					if ( sector == index ) out.push(this.valores[i][0]);
					if ( sector < index ) break;
				};
				return out;
			}
		},
		mode: 0,
		loaded: false,
		init: function(){
			var self = this;

			this.els.$tab = $("#tab-geo");
			this.els.$img = this.els.$tab.find('img');
			this.els.canvas = document.getElementById('canvas');
			this.els.$data = this.els.$tab.find('.data');
			this.els.$modo = this.els.$data.find('.btn-group[data-toggle="buttons"]:first');
			this.els.tabs = {
				$values: this.els.$data.find('.values ul'),
				$busqueda: this.els.$data.find('.busqueda ul')
			};
			this.els.$precision = this.els.$data.find('input[name="precision"]');
			this.els.$opacidad = this.els.$data.find('input[name="opacidad"]');
			this.els.coords = {
				$x: this.els.$data.find('input[name="x"]'),
				$y: this.els.$data.find('input[name="y"]'),
				$long: this.els.$data.find('input[name="long"]'),
				$lat: this.els.$data.find('input[name="lat"]')
			};

			this.canvasCreate();

			this.onEvents();
		},
		canvasCreate: function(){
			var self = this;

			$eventos.on("tab-geo",function(){
				if ( self.loaded ) return;
				self.loaded = true;

				self.els.$img.attr("src","assets/mundo.jpg").load(function(){
					self.imagen.width = this.width;
					self.imagen.height = this.height;

					self.els.canvas.width = this.width;
					self.els.canvas.height = this.height;

					var $canvas = $(self.els.canvas);
					$canvas.css( {
						"border":"2px red solid"
					});
					$(this).css({
						"margin-top":"-" + (this.height+7) + "px",
						"margin-left":"2px",
						"width":this.width + "px",
						"height":this.height + "px"
					});

					self.renderCuadricula();
				});
			});
		},
		onEvents: function(){
			var self = this;
			
			this.els.canvas.addEventListener("mousemove", function(e){
				var parentPosition = getPosition(e.currentTarget),
			    	x = Math.min(e.clientX - parentPosition.x+3,self.els.canvas.width),
			    	y = Math.min(e.clientY - parentPosition.y+4,self.els.canvas.height);

			    self.els.coords.$x.val (x);
			    self.els.coords.$y.val (y);

			    var coordenadas = self.toCoords(x,y),
			    	long = coordenadas.long,
			    	lat = coordenadas.lat;
			    self.els.coords.$long.val(long);
			    self.els.coords.$lat.val(lat);
			}, false);

			this.els.$modo.on('click','label',function(e){
				var $this = $(this),
					selected = $this.children('input').val();

				if ( selected == "agregar" ){
					self.mode = 0;
					self.els.tabs.$values.parent().show();
					self.els.tabs.$busqueda.parent().hide();
				} else {
					self.mode = 1;
					self.els.tabs.$busqueda.parent().show();
					self.els.tabs.$values.parent().hide();
				}
			});

			$(this.els.canvas).on('click',function(e){
				var x = self.els.coords.$x.val(),
				    y = self.els.coords.$y.val();

				if ( self.mode == 0 )
					self.addElemento(x,y);
				else
					self.buscarSector(x,y);
			});


			this.els.$precision.slider({value:this.precision , min: 1 , max: 8});
			this.els.$opacidad.slider({value:10 , min: 0 , max: 10, step: 1});

			this.els.$precision.on('slideStop',function(ev){
				self.precision = parseInt(ev.value); // 8 prec max
				self.render();
			});
			this.els.$opacidad.on('slide',function(ev){
				$(self.els.canvas).css("opacity",parseInt(ev.value)/10);
			});
		},
		canvasRestart: function(){
			this.els.canvas.width = this.els.canvas.width;
		},
		addElemento: function(x,y){
			var coords = this.toCoords(x,y),
		    	indice = quadtree.encode( {lat: coords.lat ,lng: coords.long } , this.precision);

		    this.quads.agregar( indice , coords );

		    this.renderElemento(x,y);

		    var $li = $('<li></li>').html( indice ).addClass("new");
		    this.els.tabs.$values.prepend( $li );
		    $li.focus().removeClass("new");
		},
		buscarSector: function(x,y){
			var coords = this.toCoords(x,y),
		    	sector = quadtree.encode( {lat: coords.lat ,lng: coords.long } , this.precision);

		    // Mostrar sector en algun lado
		    this.els.tabs.$busqueda.parent().children('h4').html(sector);

		    this.render(); // Dibujo nuevamente toda la grilla con sus puntos

		    this.renderSector(sector);
		    var search = this.quads.buscar(sector);

			this.els.tabs.$busqueda.empty();
		    for (var i = 0; i < search.length; i++) {
		    	var $li = $('<li></li>').html( search[i] ).addClass("new");
			    this.els.tabs.$busqueda.prepend( $li );
			    $li.focus().removeClass("new");
		    };
		},
		toCartesiano: function(long,lat){
			return { x: (( long + 180 ) * this.imagen.width ) / 360 , y:(( -lat + 90 ) * this.imagen.height) / 180 };
		},
		toCoords: function(x,y){
			return { long: (( x * 360 ) / this.imagen.width) - 180 , lat: -((( y * 180 ) / this.imagen.height) - 90) };
		},
		render: function(){
			this.canvasRestart();
			this.renderCuadricula();

			for (var i = 0; i < this.quads.valores.length; i++) {
				var coords = quadtree.decode(this.quads.valores[i][0]),
					carts = this.toCartesiano(coords.origin.lng,coords.origin.lat);

				this.renderElemento(carts.x,carts.y);
			};
		},
		renderCuadricula: function(){
			var its = Math.pow(2,this.precision), // iteraciones
				x_var = this.imagen.width / its,
				y_var = this.imagen.height / its;

			var context = this.els.canvas.getContext("2d");

			// Horizontal
			for( var x = 0 ; x < this.imagen.width ; x += x_var ){
				context.moveTo(x,0);
				context.lineTo(x,this.imagen.height);
			};
			// Vertical
			for( var y = 0 ; y < this.imagen.height ; y += y_var ){
				context.moveTo(0,y);
				context.lineTo(this.imagen.width,y);
			}

			context.strokeStyle = "white";
			context.stroke();
		},
		renderElemento: function(x,y){
			var context = this.els.canvas.getContext("2d");
			context.beginPath();
		    context.arc(x,y, 10, 0, 2 * Math.PI, false);
		    context.fillStyle = 'red';
		    context.fill();
		    context.lineWidth = 1;	
		    context.strokeStyle = 'white';
		    context.stroke();
		},
		renderSector: function(sector){
			var zona = quadtree.bbox(sector),
				context = this.els.canvas.getContext("2d"),
			
				origen = this.toCartesiano(zona.minlng,zona.minlat),
				dest = this.toCartesiano(zona.maxlng,zona.maxlat),

				pos = {
					x: origen.x ,
					y: origen.y ,
					w: dest.x - origen.x ,
					h: dest.y - origen.y
				};

			context.beginPath();
		    context.rect(pos.x,pos.y,pos.w,pos.h);
		    context.lineWidth = 3;
		    context.strokeStyle = 'yellow';
		    context.stroke();
		},
		reset: function(){
			this.quads.valores = new Array();

			this.els.tabs.$values.empty();
			this.els.tabs.$busqueda.empty();

			this.render();
		}
	};
	Mapa.init();

	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------
	//---------------------COMPORTAMIENTOS DE LA PAGINA-------------------------
	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------

	// Navbar general
	var $menu = $(".navbar-collapse");
	
	function showSector( hash ) {
		var id = hash.substr(1);
		$eventos.trigger("tab",[id]); // No necesario
		$eventos.trigger("tab-" + id); // Disparo un evento tab

		// Saco anterior
		$menu.find('a[href=#'+showSector.selected+']').parent().removeClass("active");
		$('#tab-'+showSector.selected).hide();
		// Mostrar actual
		showSector.selected = id;
		$menu.find('a[href=#'+id+']').parent().addClass("active");
		$('#tab-'+id).show();

	};
	showSector.selected = "";

	// Listeners
	(function(){
		// Solapas generales
		$(window).on('hashchange', function() { showSector( window.location.hash ); });
		showSector( window.location.hash );

		// Bloom solapas Db-Diff
		var $bloomTabs = $("#bloom-tabs-cont");
        $('#bloom-tabs-menu a').click(function (e) {
          e.preventDefault();
          $bloomTabs.find('.active').removeClass("active");
          $bloomTabs.find('#' + $(this).data("target") ).addClass("active");
        });

        $("ul.navbar-right > li > a[rol='reiniciar']").click(function(e){
        	switch( showSector.selected ){
        		case "bloom":
        			//
        		break;
        		case "geo":
        			//
        			Mapa.reset();
        		break;
        	}
        });
	})();

})();
