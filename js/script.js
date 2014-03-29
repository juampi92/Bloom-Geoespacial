(function(){
	console.log("Documento cargado");

	function Clase(init){
		this.atributo = "defecto";
		this.init = init;
	}
	Clase.prototype.metodo = function(parametros){
		return "contenido: " + this.init + " - " + parametros;
	};

	var instancia = new Clase("hola");
	console.log( instancia.metodo("extra") );

	var segunda_instancia = new Clase("chau");
	console.log( segunda_instancia.metodo("segunda") );

	console.log(instancia);
	console.log(segunda_instancia);

})();