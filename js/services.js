/* global angular,window */
var ionicApp = angular.module('ionicApp');

ionicApp.factory('persistanceService', ['$q', function($q) {

	var setUp=false;
	var db;
		
	function init() {
		var deferred = $q.defer();

		if(setUp) {
			deferred.resolve(true);
			return deferred.promise;
		}
		
		var openRequest = window.indexedDB.open("indexeddb_angular",3);
	
		openRequest.onerror = function(e) {
			console.log("Error opening db");
			console.dir(e);
			deferred.reject(e.toString());
		};

		openRequest.onupgradeneeded = function(e) {
	
			var thisDb = e.target.result;
			var objectStore;
			
			//Create produto OS
			if(!thisDb.objectStoreNames.contains("produto")) {
		        var produto = thisDb.createObjectStore('produto', {keyPath: 'id',  autoIncrement:true });
		        produto.createIndex('nome_idx', 'nome', {unique: false});
		        produto.createIndex('quantidade_idx', 'quantidade', {unique: false});
		        produto.createIndex('categoria_idx', 'categoria', {unique: false});
		        produto.createIndex('quantidade_lista_idx', 'quantidade_lista', {unique: false});
		        produto.createIndex('data_validade_idx', 'data_validade', {unique: false});
		        produto.createIndex('lista_automatico_idx', 'lista_automatico', {unique: false});				
			}

			if(!thisDb.objectStoreNames.contains("config")) {
		        var config = thisDb.createObjectStore('config', {keyPath: 'id',  autoIncrement:true });
		        config.createIndex('quantidade_dias_validade_idx', 'quantidade_dias_validade', {unique: false});
			}			
	
		};

		openRequest.onsuccess = function(e) {
			db = e.target.result;
			
			db.onerror = function(event) {
				// Generic error handler for all errors targeted at this database's
				// requests!
				deferred.reject("Database error: " + event.target.errorCode);
			};
	
			setUp=true;
			deferred.resolve(true);
		
		};	

		return deferred.promise;
	}
	
	function isSupported() {
		return ("indexedDB" in window);		
	}
	
	function deleteProduto(key) {
		var deferred = $q.defer();
		var t = db.transaction(["produto"], "readwrite");
		var request = t.objectStore("produto").delete(key);
		t.oncomplete = function(event) {
			deferred.resolve();
		};
		return deferred.promise;
	}
	
	function getProduto(key) {
		var deferred = $q.defer();

		var transaction = db.transaction(["produto"]);  
		var objectStore = transaction.objectStore("produto");  
		var request = objectStore.get(key);  

		request.onsuccess = function(event) {  
			var produto = request.result;
			deferred.resolve(produto);
		}; 
		
		return deferred.promise;
	}
	
	function getProdutos() {
		var deferred = $q.defer();
		
		init().then(function() {

			var result = [];

			var handleResult = function(event) {  
				var cursor = event.target.result;
				if (cursor) {
					result.push(cursor.value);
					cursor.continue();
				}
			};  
			
			var transaction = db.transaction(["produto"], "readonly");  
			var objectStore = transaction.objectStore("produto");
            objectStore.openCursor().onsuccess = handleResult;

			transaction.oncomplete = function(event) {
				deferred.resolve(result);
			};
		
		});
		return deferred.promise;
	}

	function getConfig() {
		var deferred = $q.defer();
		
		init().then(function() {

			var result = [];

			var handleResult = function(event) {  
				var cursor = event.target.result;
				if (cursor) {
					result.push(cursor.value);
					cursor.continue();
				}
			};  
			
			var transaction = db.transaction(["config"], "readonly");  
			var objectStore = transaction.objectStore("config");
            objectStore.openCursor().onsuccess = handleResult;

			transaction.oncomplete = function(event) {
				deferred.resolve(result);
			};
		
		});
		return deferred.promise;
	}	

	function saveConfig(config) {
		var deferred = $q.defer();

		init().then(function() {

			if(!config.id) config.id = "";

			
			var t = db.transaction(["config"], "readwrite");
			
	        if(config.id === "") {
	            t.objectStore("config")
	                            .add({"quantidade_dias_validade": config.quantidade_dias_validade});
	        } else {
	            t.objectStore("config")
	                            .put({"quantidade_dias_validade": config.quantidade_dias_validade, "id": config.id});
	        }

			t.oncomplete = function(event) {
				deferred.resolve();
			};

		});
		return deferred.promise;
	}	
	
	function ready() {
		return setUp;
	}
	
	function saveProduto(produto) {
		//Should this call init() too? maybe
		var deferred = $q.defer();

		init().then(function() {

			if(!produto.id) produto.id = "";

			
			var t = db.transaction(["produto"], "readwrite");
			
	        if(produto.id === "") {
	            t.objectStore("produto")
	                            .add({"id": Guid.raw(),
			                            "nome": produto.nome,
			                            "quantidade": produto.quantidade,
			                            "categoria": produto.categoria,
			                            "data_validade": produto.data_validade,
			                            "quantidade_lista": produto.quantidade_lista,
			                            "lista_automatico": produto.lista_automatico});
	        } else {
	            t.objectStore("produto")
	                            .put({"id": produto.id,
			                            "nome": produto.nome,
			                            "quantidade": produto.quantidade,
			                            "categoria": produto.categoria,
			                            "data_validade": produto.data_validade,
			                            "quantidade_lista": produto.quantidade_lista,
			                            "lista_automatico": produto.lista_automatico});
	        }

			t.oncomplete = function(event) {
				deferred.resolve();
			};

		});
		return deferred.promise;
	}
	
	function supportsIDB() {
		return "indexedDB" in window;	
	}
	
	return {
		isSupported:isSupported,
		deleteProduto:deleteProduto,
		getConfig:getConfig,
		getProduto:getProduto,
		getProdutos:getProdutos,
		ready:ready,
		saveProduto:saveProduto,
		saveConfig:saveConfig,
		supportsIDB:supportsIDB
	};

}]);


