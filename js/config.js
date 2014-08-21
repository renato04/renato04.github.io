angular.module('ionicApp.config', ['xc.indexedDB'])
.config(function ($indexedDBProvider) {
    $indexedDBProvider
      .connection('idespensa')
      .upgradeDatabase(3, function(event, db, tx){
        var produto = db.createObjectStore('produto', {keyPath: 'id'});
        produto.createIndex('nome_idx', 'nome', {unique: false});
        produto.createIndex('quantidade_idx', 'quantidade', {unique: false});
        produto.createIndex('categoria_idx', 'categoria', {unique: false});
        produto.createIndex('quantidade_lista_idx', 'quantidade_lista', {unique: false});
        produto.createIndex('data_validade_idx', 'data_validade', {unique: false});
        produto.createIndex('lista_automatico_idx', 'lista_automatico', {unique: false});

        var categoria = db.createObjectStore('categoria', {keyPath: 'id'});
        categoria.createIndex('nome_idx', 'nome', {unique: false});

        var configuracao = db.createObjectStore('configuracao', {keyPath: 'id'});
        configuracao.createIndex('quantidade_dias_validade_idx', 'quantidade_dias_validade', {unique: false});

        //configuracao.insert({"quantidade_dias_validade": 7 });

      });
  });