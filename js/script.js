(function(){
	var $eventos = $('body');
	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------
	//---------------------CLASES, OBJETOS Y FUNCIONES--------------------------
	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------

	//----------------------------------------------
	// DATO
	//----------------------------------------------
	
	function Data(key, value){
		this.key = key;
		this.value = value;
	}

	//----------------------------------------------
	// TRANSACCION
	//----------------------------------------------
	
	function Transaction(stat, data){
		this.stat = stat;
		this.data = data;
	}

	//----------------------------------------------
	// MAINFILE
	//----------------------------------------------

	function MainFile() {
		this.cont = new Array();
	}

	MainFile.prototype.read = function(key) {
		if (this.contains(key)) {
			var index = 0;
			while (this.cont[index].key !== key) { index++; }
			return this.cont[index].value;
		}
		return null;
	}

	MainFile.prototype.insert = function(data) {
		if (this.contains(data.key)) {
			var index = 0;
			while (this.cont[index].key !== data.key) {index++}
			this.cont[index].date = data.date;
			this.cont[index].value = data.value;
		}
		else {
			this.cont.push(data);
		}
	}

	MainFile.prototype.contains = function (key) {
		for (var i = 0; i < this.cont.length; i++) {
			if (key == this.cont[i].key)
				return true
		}
		return false;
	}

	MainFile.prototype.del = function (key) {
		var index = 0;
		while (this.cont[index].key !== key) {index++}
		this.cont.splice(index,1);
	}

	MainFile.prototype.reorganize = function (diffile) {
		// Por cada elemento del Differential File
		for (var index = 0; index < diffile.cont.length; index++) {
			// Si es una actualizacion, actualizo
			if (diffile.cont[index].stat == "new") {
				this.insert(diffile.cont[index].data)
			}
			// Si es un borrado y el elemento existe, lo elimino
			else if (diffile.cont[index].stat == "delete") {
				if (this.contains(diffile.cont[index].data.key)) {
					this.del(diffile.cont[index].data.key);
				}
			}
		}
		diffile.clean();
	}

	MainFile.prototype.visual = function () {
		/*var conteiner = document.getElementById("mainfile");

		if (conteiner == null) {
			var display = document.getElementById("datavisual");
			conteiner = document.createElement("table");
			conteiner.id = "mainfile";
			display.appendChild(conteiner);
		}
		else {
			$("#mainfile").empty();
		}

		for (var index = 0; index < this.cont.length; index++) {
			var fila = document.createElement("tr");
			var key = document.createElement("td");
			var value = document.createElement("td");
			fila.appendChild(key);
			fila.appendChild(value);
			conteiner.appendChild(fila);
			key.innerHTML(this.cont[index].key);
			value.innerHTML(this.cont[index].value);
		}*/
	}

	//----------------------------------------------
	// DIFFERENTIAL FILE
	//----------------------------------------------

	function DifferentialFile() {
		this.cont = new Array();
	}

	DifferentialFile.prototype.read = function(key) {
		if (this.contains(key)) {
			var index = 0;
			while (this.cont[index].data.key !== key) { index++; }
			return this.cont[index].data.value;
		}
		return null;
	}

	DifferentialFile.prototype.contains = function(key) {
		for (var index = 0; index < this.cont.length; index++) {
			if (this.cont[index].data.key == key) { return true; }
		}
		return false;
	}

	DifferentialFile.prototype.insert = function (transaction) {
		if (this.contains(transaction.data.key)) {
			var index = 0;
			while (this.cont[index].data.key !== transaction.data.key) { index++; }
			this.cont[index].stat = transaction.stat;
			this.cont[index].data.value = transaction.data.value;
		}
		else {
			this.cont.push(transaction);
			bloom.insert(transaction.data.key);
		}
	}

	DifferentialFile.prototype.visual = function() {
		var conteiner = document.getElementById("diffile");

		$("#diffile").empty();

		var accion = document.createElement("th");
		var clave = document.createElement("th");
		var valor = document.createElement("th");
		accion.innerHTML = "Acción";
		clave.innerHTML = "Clave";
		valor.innerHTML = "Valor";
		accion.className = "datacell";
		clave.className = "datacell";
		valor.className = "datacell";
		var cabezera = document.createElement("tr");
		cabezera.className = "datarow";
		cabezera.appendChild(accion);
		cabezera.appendChild(clave);
		cabezera.appendChild(valor);
		conteiner.appendChild(cabezera);

		for (var index = 0; index < this.cont.length; index++) {
			var fila = document.createElement("tr");
			fila.className = "datarow";
			var stat = document.createElement("td");
			var key = document.createElement("td");
			var value = document.createElement("td");
			stat.className = "datacell";
			key.className = "datacell";
			value.className = "datacell";

			
			stat.innerHTML = this.cont[index].stat;
			key.innerHTML = this.cont[index].data.key;
			value.innerHTML = this.cont[index].data.value;
			
			fila.appendChild(stat);
			fila.appendChild(key);
			fila.appendChild(value);
			conteiner.appendChild(fila);
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

	BloomFilter.$el = $('#tab-bloom > #mid-col');
	BloomFilter.$els = {
		$bools: BloomFilter.$el.find('table tr:eq(0)'),
		$values: BloomFilter.$el.find('table tr:eq(1)'),
		$txt: BloomFilter.$el.find('p')
	};

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

	BloomFilter.prototype.evaluate = function(key) {
		var values = new Array();
		values[0] = murmur(key)%this.size;
		values[1] = fnv1s(key)%this.size;
		return values;
	}

	BloomFilter.prototype.visual = function() {
		// Ancho en % de cada casilla
		var rowbool = document.getElementById("bloomboleans");
		var rowvalues = document.getElementById("bloomvalues");

		// Existen los arreglos, asi que borro sus hijos
		BloomFilter.$els.$bools.empty();
		BloomFilter.$els.$values.empty();
		
		for (i=0; i < this.size ; i++) {
			var $td_bool = $('<td></td>'),
				$td_val = $('<td></td>');

			$td_bool.attr("_id",i);
			$td_val.attr("_id",i);

			$td_val.addClass("static").html(this.values[i]);

			if (this.bools[i])
				$td_bool.addClass("true");
			else
				$td_bool.addClass("false");

			BloomFilter.$els.$bools.append($td_bool);
			BloomFilter.$els.$values.append($td_val);
		}
	}

	BloomFilter.prototype.iluminate = function(key) {
		this.visual();
		if (key !== "") {
			var values = this.evaluate(key);
			
			BloomFilter.$els.$bools.find('td[_id='+values[0]+']').addClass("iluminate");
			BloomFilter.$els.$bools.find('td[_id='+values[1]+']').addClass("iluminate");
			console.log(values[0],values[1]);
		}
	}


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
		quads: [],
		init: function(){
			var self = this;

			this.els.$tab = $("#tab-geo");
			this.els.$img = this.els.$tab.find('img');
			this.els.canvas = document.getElementById('canvas');
			this.els.$data = this.els.$tab.find('.data');
			this.els.$values = this.els.$data.find('ul');
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

			this.els.$img.attr("src","assets/mundo.jpg").load(function(){
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
		},
		onEvents: function(){
			var self = this;
			
			this.els.canvas.addEventListener("mousemove", function(e){
				var parentPosition = getPosition(e.currentTarget),
			    	x = e.clientX - parentPosition.x+3,
			    	y = e.clientY - parentPosition.y+4;

			    self.els.coords.$x.val (x);
			    self.els.coords.$y.val (y);

			    var coordenadas = self.toCoords(x,y),
			    	long = coordenadas.long,
			    	lat = coordenadas.lat;
			    self.els.coords.$long.val(long);
			    self.els.coords.$lat.val(lat);
			}, false);

			$(this.els.canvas).on('click',function(e){
				var x = self.els.coords.$x.val(),
			    	y = self.els.coords.$y.val();

			    self.addElemento(x,y);
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
		    	elemento = quadtree.encode( {lat: coords.lat ,lng: coords.long } , this.precision);

		    this.quads.push( elemento );

		    this.renderElemento(x,y);

		    var $li = $('<li></li>').html( elemento ).addClass("new");
		    this.els.$values.prepend( $li );
		    $li.focus().removeClass("new");
		},
		toCartesiano: function(long,lat){
			return { x: (( long + 180 ) * this.imagen.width ) / 360 , y:(( lat + 90 ) * this.imagen.height) / 180 };
		},
		toCoords: function(x,y){
			return { long: (( x * 360 ) / this.imagen.width) - 180 , lat: (( y * 180 ) / this.imagen.height) - 90 };
		},
		render: function(){
			this.canvasRestart();
			this.renderCuadricula();

			for (var i = 0; i < this.quads.length; i++) {
				var coords = quadtree.decode(this.quads[i]),
					carts = this.toCartesiano(coords.origin.lng,coords.origin.lat);
				console.log("El: " + this.quads[i] + ". Coords: " + coords.origin.lng +","+coords.origin.lat + " - Carts: " + 
				carts.x + "," + carts.y );

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
		}
	};
	Mapa.init();

	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------
	//---------------------COMPORTAMIENTOS DE LA PAGINA-------------------------
	//--------------------------------------------------------------------------
	//--------------------------------------------------------------------------

	var main = new MainFile();
	var diff = new DifferentialFile();
	var bloom = new BloomFilter(20);

	bloom.visual();
	diff.visual();
	main.visual();

	// Navbar general
	var $menu = $(".navbar-collapse");
	
	function showSector( hash ) {
		var id = hash.substr(1);
		$eventos.trigger("tab",[id]); // No necesario
		$eventos.trigger("tab-" + id); // Disparo un evento tab

		switch (showSector.valores[id]) {
			case 1:
				// Saco anterior
				$menu.find('a[href=#'+showSector.selected+']').parent().removeClass("active");
				$('#tab-'+showSector.selected).hide();
				// Mostrar actual
				showSector.selected = id;
				$menu.find('a[href=#'+id+']').parent().addClass("active");
				$('#tab-'+id).show();
			break;
			case 2:
				// Show modal
				console.log("Mostrar modal " + id);
			break;
			default: // does nothing
			break;
		}
	};
	showSector.selected = "";
	showSector.valores = {
		"" : 1,
		"bloom" : 1,
		"geo" : 1,
		"informe": 2,
		"help": 2,
		"clear": 0
	};
	

	// Listeners
	(function(){
		$("#insertkey").keyup(function(){
			bloom.iluminate($(this).val());
		});

		$("#btninsert").on("click", function()  {
			var key = $("#insertkey").val();
			var value = $("#insertvalue").val();
			if (key !== "") {
				diff.insert(new Transaction("new",new Data(key,value)));
			}
			diff.visual();
			bloom.visual();
		});

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
	})();

})();
