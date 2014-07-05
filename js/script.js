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

	function File(records, tablename) {
		// LOGICA
		this.cont = [];
		this.size = records;
		for (var index = 0; index < this.size; index++) {
			this.cont.push(new Record(index,""));
		}
		// VISUAL
		this.table = $('#tab-bloom #right-col #'+tablename);
		this.toggle = $("#"+tablename+"-toggle");
		this.ilumined = null;
		this.tab = $("#bloom-tabs-cont");
		this.visual();
	}

	File.prototype.read = function(key) {
		if (this.contains(key)) {
			var index = 0;
			while (this.cont[index].key != key) { index++; }
			return this.cont[index].value;
		}
		return null;
	};

	File.prototype.insert = function(data) {
		var index = this.getIndex(data.key);

		if (index == -1) {
			// PARTE LOGICA
			this.cont.push(data);
			this.size++;
			// PARTE VISUAL
			var fila = document.createElement("tr");
			var key = document.createElement("td");
			var value = document.createElement("td");
			key.className = "datacell";
			value.className = "datacell";
			key.innerHTML = data.key;
			value.innerHTML = data.value;
			fila.appendChild(key);
			fila.appendChild(value);
			this.table.append(fila);
		}
		else {
			// PARTE LOGICA
			this.cont[index].value = data.value;
			// PARTE VISUAL
			this.table.find('tr:eq('+parseInt(parseInt(index)+1)+') td:eq(1)').empty().append(data.value);
		}

		this.toggle.click();
	};

	File.prototype.getIndex = function(key) {
		for (var index = 0; index < this.size; index++)
			if (this.cont[index].key == key)
				return index;
		return -1;
	};

	File.prototype.contains = function (key) {
		if (this.getIndex(key) == -1)
			return false;
		else
			return true;
	};

	File.prototype.emtpy = function (key) {
		if (this.contains(key))
			return (this.read(key) === '');
		return false;
	};

	File.prototype.delete = function (key) {
		this.insert(new Record(key,""));
	};

	File.prototype.reorganize = function (diffile) {
		for (var index = 0; index < diffile.cont.length; index++) {
			this.insert(diffile.cont[index]);
		}
		diffile.clear(0);
		this.desiluminate();
	};

	File.prototype.clear = function(records) {
		this.desiluminate();
		this.cont.splice(0, this.cont.length);
		this.size = records;
		for (var index = 0; index < this.size; index++) {
			this.cont.push(new Record(index,""));
		}
		this.visual();
	};

	File.prototype.visual = function () {
		this.table.empty();

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
		this.table.append(cabezera);

		for (var index = 0; index < this.cont.length; index++) {
			var fila = document.createElement("tr");
			var key = document.createElement("td");
			var value = document.createElement("td");
			fila.className = "datarow";
			key.className = "datacell";
			value.className = "datacell";
			fila.appendChild(key);
			fila.appendChild(value);
			this.table.append(fila);
			key.innerHTML = this.cont[index].key;
			value.innerHTML = this.cont[index].value;
		}
	};

	File.prototype.iluminate = function(key) {
		var index = this.getIndex(key);
		var fila = this.table.find('tr:eq('+parseInt(parseInt(index)+1)+')');
		if (fila != this.ilumined) {
			this.desiluminate();
			if (index != -1) {
				this.ilumined = fila;
				(fila.children()).addClass('iluminate');
				// Toggle
				this.toggle.click();
			}
		}
	};

	File.prototype.desiluminate = function() {
		if (this.ilumined !== null) {
			(this.ilumined.children()).removeClass('iluminate');
			this.ilumined = null;
		}
	};

	//----------------------------------------------
	// BLOOM FILTER
	//----------------------------------------------

	// VARIABLES
	var main = new File(100,"mainfile");
	var diff = new File(0,"diffile");

	var bloom = {
		el : {},
		els : {},
		contenedores : {},
		bools : null,
		ilumined : null,
		functions : {},
		boolmurmur : null,
		boolfnv : null,

		init: function(size, keys, bm, bf) {

			this.el = $('#tab-bloom > #mid-col');
			this.els = {
				bools: this.el.find('table'),
				txt: this.el.find(':first'),
				resmur: null,
				resfnv: null,
				res: null,
				resmod: [],
				keymod: []
			};

			this.contenedores = {
				m : $('#tammain'),
				d : $('#tamdif'),
				u : $('#regunused'),
				o : $('#ocupado'),
				f : $('#falsopositivo'),
				h : {}
			};

			this.functions = keys;
			this.bools = [];
			this.ilumined = null;
			this.boolmurmur = bm;
			this.boolfnv = bf;
			this.size = size;

			// LIMPIO LAS COSAS EN CASO DE REINICIO
			this.els.txt.empty();

			var label;
			var span;
			if (this.boolmurmur) {
				label = $('<label style="width:32%; margin-left:5px; margin-bottom: 0px">Murmur Hash: </label>');
				span = $('<span style="margin-bottom: 0px; color: #199B9B;"> </span>');
				this.els.murmur = span;
				label.append(span);
				this.els.txt.append(label);
			}

			if (this.boolfnv) {
				label = $('<label style="width:32%; margin-left:5px; margin-bottom: 0px">FNV Hash: </label>');
				span = $('<span style="margin-bottom: 0px; color: #199B9B;"> </span>');
				this.els.fnv = span;
				label.append(span);
				this.els.txt.append(label);
			}

			var pos = 0;
			while ( pos < this.functions.length) {
				label = $('<label style="width:32%; margin-left:5px; margin-bottom: 0px">');
				label.append('( ' + this.functions[pos] + ' * ' );
				span = $('<span style="margin-bottom: 0px; color: #199B9B;"> </span>');
				label.append(span);
				this.els.keymod.push(span);
				label.append(' ) Mod ' + this.size + ': </label>');
				span = $('<span style="margin-bottom: 0px; color: #199B9B;"> </span>');
				label.append(span);
				this.els.resmod.push(span);
				this.els.txt.append(label);
				pos++;
			}

			span = $('<span style="margin-bottom: 0px; color: #199B9B;"> </span>');
			this.els.res = span;
			label = $('<label style="width:32%; margin-left:5px; margin-bottom: 0px">Resultado: </label>');
			label.append(span);
			this.els.txt.append(label);

			this.clear(size);
		},

		insert : function (key) {
			// PARTE LOGICA
			var values = this.evaluate(key);
			for (var i = 0; i < values.length; i++) {
				this.bools[values[i]] = true;
			}
			this.cant++;

			// PARTE VISUAL
			for (var i = 0; i < values.length; i++) {
				this.els.bools.find('td[_id='+values[i]+']').addClass("true");
			}

			var unusedrecord = (main.size - diff.size) / main.size;

			this.contenedores.m.empty(); this.contenedores.m.append(main.size);
			this.contenedores.d.empty(); this.contenedores.d.append(diff.size);
			this.contenedores.u.empty(); this.contenedores.u.append(Math.round(100*unusedrecord) + '%');
			
			var total = 0;
			for (var i = 0; i < this.size; i++) {
				if (this.bools[i]) { total++;}
			}
			var usedbits = total/this.size;
			this.contenedores.o.empty(); this.contenedores.o.append(Math.round(100*usedbits) + "%");
			
			var cantfunc = this.functions.length;
			if (this.boolmurmur) { cantfunc++; }
			if (this.boolfnv) { cantfunc++; }
			var prob = Math.round( 100 * ( unusedrecord * Math.pow ( usedbits , cantfunc ) ) );
			this.contenedores.f.empty(); this.contenedores.f.append(prob + "%");
		},

		contains: function (key) {
			var values = this.evaluate(key);
			for (var i = 0; i < values.length; i++) {
				if (!this.bools[values[i]]) { return false; }
			}
			return true;
		},

		evaluate : function(key) {
			var values = [];
			var pos = 0;
			if (this.boolmurmur) {
				values[pos] = murmur(key)%this.size;
				pos++;
			}
			if (this.boolfnv) {
				values[pos] = fnv1s(key)%this.size;
				pos++;
			}
			for (var i = 0; i < this.functions.length; i++) {
				values[pos] = (this.functions[i]*key)%this.size;
				pos++;
			}
			return values;
		},

		clear : function(size) {
			this.desiluminate();
			this.bools.splice(0, this.bools.length);
			if ( size !== undefined ) this.size = size;
			for (var index = 0; index < this.size; index++) {
				this.bools[index] = false;
			}
			this.cant = 0;
			this.ilumined = null;
			this.visual();
		},

		visual : function() {
			// Existen los arreglos, asi que borro sus hijos
			$(this.els.bools).empty();
			var $row;
			var cant = 0;
			for (var i=0; i < this.size ; i++) {
				if (cant === 0) {
					$row = $('<tr></tr>');
					this.els.bools.append($row);
				}
				var $td_bool = $('<td></td>');
				$td_bool.attr("_id",i);
				$td_bool.addClass("false");
				($row).append($td_bool);
				cant++;
				if (cant >= 19) { cant = 0;	}
			}

			this.contenedores.m.empty(); this.contenedores.m.append(main.size);
			this.contenedores.d.empty(); this.contenedores.d.append(diff.size);
			this.contenedores.u.empty(); this.contenedores.u.append('100%');
			this.contenedores.o.empty(); this.contenedores.o.append('0%');
			this.contenedores.f.empty(); this.contenedores.f.append('0%');

			for (var i = 0; i < this.els.resmod.length; i++) {
				this.els.resmod[i].empty();
				this.els.keymod[i].empty();
				this.els.keymod[i].append('ID');
			}
		},

		iluminate : function(key) {
			if (key != this.ilumined) {
				this.desiluminate();
				this.ilumined = key;
				if (key !== '') {
					var values = this.evaluate(key),
						i;
					for (i = 0; i < values.length; i++) {
						this.els.bools.find('td[_id='+values[i]+']').addClass("iluminate");
					}
					
					var pos = 0;

					if (this.boolmurmur) {
						this.els.murmur.empty();
						this.els.murmur.append(values[pos]);
						pos++;
					}

					if (this.boolfnv) {
						this.els.fnv.empty();
						this.els.fnv.append(values[pos]);
						pos++;
					}

					i = 0;

					while (pos < values.length) {
						this.els.resmod[i].empty();
						this.els.resmod[i].append(values[pos]);
						this.els.keymod[i].empty();
						this.els.keymod[i].append(key);
						i++;
						pos++;
					}

					this.els.res.css('color','#199B9B');

					if (!this.contains(key)) {
						this.els.res.empty();
						this.els.res.append('Negativo');
					}
					else if (diff.contains(key)) {
						this.els.res.empty();
						this.els.res.append('Positivo');
					}
					else {
						this.els.res.empty();
						this.els.res.append('Falso Positivo');
						this.els.res.css('color','red');
					}
				}
			}
		},

		desiluminate : function() {
			if (this.ilumined !== null) {
				var values = this.evaluate(this.ilumined);
				this.ilumined = null;
				for (var i = 0; i < values.length; i++) {
					this.els.bools.find('td[_id='+values[i]+']').removeClass("iluminate");
				}

				if (this.boolmurmur)
					this.els.murmur.empty();
				if (this.boolfnv)
					this.els.fnv.empty();
				this.els.res.empty();

				for (var i = 0; i < this.els.resmod.length; i++) {
					this.els.resmod[i].empty();
					this.els.keymod[i].empty();
					this.els.keymod[i].append('ID');		
				}
			}
		}
	};

	bloom.init(21,[],true,true);

	//----------------------------------------------
	// FUNCION DE HASH - MURMUR 
	//----------------------------------------------
	
	function murmur(str, seed) {
		var m = 0x5bd1e995,
			r = 24,
			h = seed ^ str.length,
			length = str.length,
			currentIndex = 0;
		
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
	function bloomreset() {
		var mainsize = parseInt($('#main-size').val());
		var murmur = $('#murmur').is(':checked');
		var fnv = $('#fnv').is(':checked');
		var bloomsize = parseInt($('#bloom-size').val());
		var kvalues = getKvalues();
 		if ( ($.isNumeric(mainsize)) && (mainsize > 0) && ($.isNumeric(bloomsize)) && (bloomsize > 0) ) {
			main.clear(mainsize);
			diff.clear(0);
			bloom.init(bloomsize,kvalues,murmur,fnv);
			$('#bloomModal').modal('hide');
		}
	}

	function getKvalues() {
		var texto = $('#kvalues').val();
		var aux = 0;
		var valores = [];
		for (var i = 0; i < texto.length; i++) {
			if ($.isNumeric(texto.charAt(i))) {
				aux = aux*10 + parseInt(texto.charAt(i));
			}
			else {
				if (aux != 0) {
					valores.push(aux);
					aux = 0;
				}
			}
		}
		if (aux != 0) {
			valores.push(parseInt(aux));
		}
		return valores;
	}

	function reset(id) {
		var input = $("#"+id);
		$(input).val("");
		input.removeClass("valid");
		input.removeClass("invalid");
	}

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
			if (key === '') { reset("insertkey"); }
		}
	}

	function insertvalueinput() {
		reset("readkey");
		reset("deletkey");
		reset("outvalue");

		var key = $("#insertkey").val();
		if (key === '') { desiluminar(); }

		var value = $("#insertvalue").val();
		if (value !== '') { $("#insertvalue").addClass("valid"); }
		else { $("#insertvalue").removeClass("valid"); }
	}

	function readkeyinput() {
		reset("insertkey");
		reset("deletkey");
		reset("outvalue");
		reset("insertvalue");

		var key = $("#readkey").val();
		
		if (enrango("readkey")) {
			bloom.iluminate(key);
			var value;

			if (diff.contains(key)) {
				diff.iluminate(key);
				value = diff.read(key);
				if (value != '')
					$("#outvalue").val('"'+value+'"');
				else
					$("#outvalue").val('VACIO');
				}
			else {
				main.iluminate(key);
				value = main.read(key);
				if (value !== '')
					$("#outvalue").val('"'+value+'"');
				else
					$("#outvalue").val('VACIO');
			}
		}
		else {
			desiluminar();
			if (key === '') reset("readkey");
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
			if (diff.contains(key))
				diff.iluminate(key);
			else
				main.iluminate(key);
		}
		else {
			desiluminar();
			if (key === '') reset("deletkey");
		}
	}

	function mainsizeinput() {
		var input =  $("#main-size");
		var valor = $(input).val();
		if (valor == '') {
			$(input).removeClass("invalid");
			$(input).removeClass("valid");
		}
		else if (!($.isNumeric(valor))) {
			$(input).addClass("invalid");
			$(input).removeClass("valid");
		}
		else {
			$(input).addClass("valid");
			$(input).removeClass("invalid");
		}
	}
	
	function bloomsizeinput() {
		var input =  $("#bloom-size");
		var valor = $(input).val();
		if (valor == '') {
			$(input).removeClass("invalid");
			$(input).removeClass("valid");
		}
		else if (!($.isNumeric(valor))) {
			$(input).addClass("invalid");
			$(input).removeClass("valid");
		}
		else {
			$(input).addClass("valid");
			$(input).removeClass("invalid");
		}
	}

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

		$("#main-size").keyup(function(){
			mainsizeinput();
		});

		$("#main-size").on("change", function(){
			mainsizeinput();
		});

		$("#bloom-size").keyup(function(){
			bloomsizeinput();
		});

		$("#bloom-size").on("change", function(){
			bloomsizeinput();
		});

		$("#btninsert").on("click", function()  {
			reset("readkey");
			reset("deletkey");
			reset("outvalue");

			var key = $("#insertkey").val();
			var value = $("#insertvalue").val();

			if (enrango("insertkey")) {
				if (value) {
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
		});

		$("#btnreorganize").on("click", function()  {
			main.desiluminate();
			main.reorganize(diff);
			bloom.clear(bloom.size);
		});

		$("#reset-bloom").on("click", function()  {
			bloomreset();
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

					if ( indice < index ) break;
					if ( indice == index ) { i++; break; }
				}
				this.valores.splice(i, 0,[indice,elemento]);
			},
			buscar: function(sector){
				var out = [];
				for (var i = 0; i < this.valores.length; i++) {
					var index = ""+this.valores[i][0];
					if ( index.length > sector.length )
						index = index.substr(0,sector.length);

					if ( sector == index ) out.push(this.valores[i][0]);
					if ( sector < index ) break;
				}
				return out;
			}
		},
		mode: 0,
		loaded: false,
		init: function(){
			var self = this;

			this.els.$tab = $("#tab-geo");
			this.els.$img = this.els.$tab.find('img#mundo');
			this.els.canvas = document.getElementById('canvas');
			this.els.$data = this.els.$tab.find('.data');
			this.els.$modo = this.els.$data.find('.btn-group[data-toggle="buttons"]:first');
			this.els.btns = {
				$actionBtn: this.els.$data.find('button[name="action"]'),
				$qdtreeBtn: this.els.$data.find('button[name="actionQuadTree"]')
			};
			this.els.tabs = {
				$values: this.els.$data.find('.values ul'),
				$busqueda: this.els.$data.find('.busqueda ul')
			};
			this.els.$precision = this.els.$data.find('input[name="precision"]');
			this.els.$opacidad = this.els.$data.find('input[name="opacidad"]');
			this.els.coords = {
				$x: this.els.$data.find('input[name="x"]'),
				$y: this.els.$data.find('input[name="y"]'),
				$long: this.els.$data.find('output[name="long"]'),
				$lat: this.els.$data.find('output[name="lat"]'),
				$indice: this.els.$data.find('input[name="qdtree"]')
			};

			this.els.$loading = this.els.$tab.find('.loading');

			this.canvasCreate();

			this.onEvents();
		},
		canvasCreate: function(){
			var self = this;

			$eventos.on("tab-geo",function(){
				if ( self.loaded ) return;
				self.loaded = true;

				self.els.$img.attr("src","assets/mundo.jpg").load(function(){
					self.els.$img.width = self.imagen.width = self.els.canvas.width = this.width;
					self.els.$img.height = self.imagen.height = self.els.canvas.height = this.height;

					self.els.$loading.remove();

					var $canvas = $(self.els.canvas);
					$canvas.css( {
						"border":"2px red solid",
						"display":"inline-block"
					});
					$(this).css({
						"visibility":"visible",
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
				self.els.btns.$actionBtn.html( $this.data('txt') );
				self.els.btns.$qdtreeBtn.html( $this.data('txt') );
			});

			$(this.els.canvas).on('click',function(e){
				self.clickAction();
			});

			$(this.els.btns.$actionBtn).on('click',function(e){
				self.clickAction();
			});
			$(this.els.btns.$qdtreeBtn).on('click',function(e){
				var $input = self.els.coords.$indice,
					val = $input.val();
				$input.removeClass("error");
				if ( val && $.isNumeric(val) )
					self.clickAction(true);
				else
					$input.addClass("error");
			});


			this.els.$precision.slider({value:this.precision , min: 1 , max: 8});
			this.els.$opacidad.slider({value:10 , min: 0 , max: 10, step: 1});

			this.els.$precision.on('slideStop',function(ev){
				self.precision = parseInt(ev.value,10); // 8 prec max
				self.render();
			});
			this.els.$opacidad.on('slide',function(ev){
				$(self.els.canvas).css("opacity",parseInt(ev.value,10)/10);
			});
		},
		clickAction: function(inQuadtree){
			if ( !inQuadtree ) {
				var x = this.els.coords.$x.val(),
						y = this.els.coords.$y.val();

				this.elementAction(x,y);
			} else {
				var indice = this.els.coords.$indice.val();
				this.elementAction(null,null,indice);
			}
		},
		canvasRestart: function(){
			this.els.canvas.width = this.els.canvas.width;
		},
		elementAction: function(x,y,indice){
			var coords,_indice = null,_x,_y;
			if ( indice === undefined ) {
				// Especificados por las coordenadas x,y
				coords = this.toCoords(x,y);
				_indice = quadtree.encode( {lat: coords.lat ,lng: coords.long } , this.precision);
				_x = x;
				_y = y;
			} else {
				// Especificados por el indice geoespacial
				coords = quadtree.decode(indice);
				var cart = this.toCartesiano(coords.origin.lng,coords.origin.lat);
				_indice = indice;
				_x = cart.x >> 0;
				_y = cart.y >> 0;
			}

			this._elementAction(_x,_y,_indice);
		},
		_elementAction: function(x,y,indice){
			this.els.coords.$indice.val(indice);
			this.els.coords.$x.val(x);
			this.els.coords.$y.val(y);

			var $li;
			if ( ! this.mode ){
				// Add new element
				this.quads.agregar( indice , this.toCoords(x,y) );
				this.renderElemento(x,y);

				$li = $('<li></li>').html( indice ).addClass("new");
				this.els.tabs.$values.prepend( $li );
				$li.focus().removeClass("new");

			} else {
				// Search in box
				this.render(); // Dibujo nuevamente toda la grilla con sus puntos
				this.renderSector(indice);

				var search = this.quads.buscar(indice);

				this.els.tabs.$busqueda.empty();

				for (var i = 0; i < search.length; i++) {
					$li = $('<li></li>').html( search[i] ).addClass("new");
					this.els.tabs.$busqueda.prepend( $li );
					$li.focus().removeClass("new");
				}
			}
			
		},
		buscarSector: function(x,y){
			var coords = this.toCoords(x,y),
					sector = quadtree.encode( {lat: coords.lat ,lng: coords.long } , this.precision);

				// Mostrar sector en algun lado
				this.els.tabs.$busqueda.parent().children('h4').html(sector);

				
				

			this.els.tabs.$busqueda.empty();
				for (var i = 0; i < search.length; i++) {
					var $li = $('<li></li>').html( search[i] ).addClass("new");
					this.els.tabs.$busqueda.prepend( $li );
					$li.focus().removeClass("new");
				}
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
			}
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
			}
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
			this.quads.valores = [];

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

	}
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
							$('#bloomModal').modal('show');
						break;
						case "geo":
							Mapa.reset();
						break;
					}
				});
	})();

})();
