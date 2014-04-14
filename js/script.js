(function(){
	
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

		var m = document.getElementById("tammain");
		var d = document.getElementById("tamdif");
		var u = document.getElementById("regunused");
		var o = document.getElementById("ocupado");
		var f = document.getElementById("falsopositivo");
		
		m.innerHTML = main.size;
		d.innerHTML = diff.size;
		u.innerHTML = "100%";
		o.innerHTML = "0%";
		f.innerHTML = "0%";
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
	

	var $eventos = $('body');
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
	})();

	// HACER FUNCION SCROLL TO
})();