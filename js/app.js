angular.module('ionicApp', ['ionic'])

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "tabs.html"
    })
    .state('tabs.home', {
      url: "/home",
      views: {
        'home-tab': {
          templateUrl: "home.html",
          controller: 'HomeTabCtrl'
        }
      }
    })
    .state('tabs.produto', {
      url: "/produto",
      views: {
        'home-tab': {
          templateUrl: "produto.html",
          controller: 'ProdutoController'
        }
      }
    })  
    .state('tabs.produto.new', {
      url: "/edit?id",
      views: {
        'home-tab': {
          templateUrl: "produto.html",
          controller: 'ProdutoController'
        }
      }
    })       
    .state('tabs.about', {
      url: "/about",
      views: {
        'about-tab': {
          templateUrl: "about.html"
        }
      }
    })
    .state('tabs.config', {
      url: "/config",
      views: {
        'config-tab': {
          templateUrl: "config.html",
          controller: 'ConfigTabCtrl'
        }
      }
    });


   $urlRouterProvider.otherwise("/tab/home");

})
.controller('ConfigTabCtrl', function($scope, $ionicNavBarDelegate, persistanceService) {

  $scope.config = {};

  $scope.save = function(config) {
    
    persistanceService.saveConfig(config).then(function() {
       $ionicPopup.alert({
         title: 'iDespensa',
         template: 'Configurações Salvas.'
       }).then( function(){
            $scope.safeApply(function(){
                $ionicNavBarDelegate.go('tabs.home');
            });
       });    
    });

  };  

  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if(phase == '$apply' || phase == '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };    

  function Carrega()
  {
    persistanceService.getConfig().then(function(res) {  
      $scope.config = res[0];
    });
  }

  Carrega();

})
.controller('HomeTabCtrl', function($scope, $ionicModal, $ionicPopover,  $state, $ionicActionSheet, $ionicPopup, persistanceService) {
  $scope.produto = {};
  $scope.items = [];

  document.body.classList.remove('platform-ios');
  document.body.classList.remove('platform-android');
  document.body.classList.add('platform-android');
  $ionicModal.fromTemplateUrl('quantidade.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {

    $scope.modal = modal;
  });

  $scope.openModal = function(produto) {
    $scope.produto = produto;
    $scope.modal.show();
  };

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });  

  $ionicPopover.fromTemplateUrl('menu.html', {
      scope: $scope,
    }).then(function(popover) {
      $scope.popover = popover;
    });

  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };  

  $scope.add = function(produto) {
    produto.quantidade += 1;
    persistanceService.saveProduto(produto);
  };  

  $scope.remove = function(produto) {
    produto.quantidade -= 1;
    persistanceService.saveProduto(produto);
  };   

  $scope.listaVazia = function(){
    return $scope.items.length == 0;
  };

  $scope.goDespensa = function() {
    $scope.closePopover();
    persistanceService.getProdutos().then(function(res) {
      $scope.items = res;
    });    
  };

  $scope.goProduto = function()
  {
    $scope.closePopover();
    $state.go('tabs.produto');
  };

  $scope.goLista = function()
  {
    $scope.closePopover();
    $scope.items = [];
    persistanceService.getProdutos().then(function(res) {
        $scope.items = _.filter(res, function(produto){
                    return produto.lista_automatico &&
                           produto.quantidade <= produto.quantidade_lista;
               });
    });        
  };  

  $scope.goVencendo = function()
  {
    $scope.closePopover();
    $scope.items = [];
    persistanceService.getProdutos().then(function(res) {
        $scope.items = _.filter(res, function(produto){
            var diferenca = moment(produto.data_validade, "YYYY-MM-DD").diff(moment(), 'days');

            return diferenca <= $scope.config.quantidade_dias_validade;
        });
    });
  };

  $scope.showActionsheet = function(produto) {
    
    $ionicActionSheet.show({
      titleText: 'Ações',
      buttons: [
        { text: 'Editar' },
      ],
      destructiveText: 'Deletar',
      cancelText: 'Cancelar',
      cancel: function() {
        console.log('CANCELLED');
      },
      buttonClicked: function(index) {
        console.log('BUTTON CLICKED', index);

        switch(index)
        {
          case 0:
            $state.go('tabs.produto.new',{"id":produto.id});
            break;
        }
        return true;
      },
      destructiveButtonClicked: function() {
        console.log('DESTRUCT');

        var confirmPopup = $ionicPopup.confirm({
         title: 'Deletar Produto',
         template: 'Tem certeza?',
         cancelText: 'Não',
         okText: 'Sim'
        });
        confirmPopup.then(function(res) {
         if(res) {
           persistanceService.deleteProduto(produto.id).then(function(res){
             $scope.goDespensa();
           });
         } 
        });        
        return true;
      }
    });
  };

  function CarregaConfig()
  {
    persistanceService.getConfig().then(function(res) {
          if (res.length == 0) {
            persistanceService.saveConfig({"quantidade_dias_validade": 7}).then(function(res){
                persistanceService.getConfig().then(function(res) {
                  $scope.config = res[0];
                });
            }); 
          }
          $scope.config = res[0];
        });    
  }

  if(persistanceService.supportsIDB()) {
    CarregaConfig();
    persistanceService.getProdutos().then(function(res) {
      $scope.items = res;
    });  
  } else {
    alert("Esse dispositivo não fornece suporte a esse aplicativo");
  }  
})
.controller('ProdutoController', function($scope, $ionicNavBarDelegate, $ionicPopup, $location, persistanceService){

  $scope.produto = {};

  var query = $location.search();

  if (query.id) {
    persistanceService.getProduto(query.id).then(function(produto) {
      $scope.produto = produto;
    });
  }  

 
  $scope.save = function(produto) {
    
    persistanceService.saveProduto(produto).then(function() {
       $ionicPopup.alert({
         title: 'iDespensa',
         template: 'Ação executada com sucesso.'
       }).then( function(){
            $scope.safeApply(function(){
                $ionicNavBarDelegate.back();
            });
       });    
    });

  };

  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if(phase == '$apply' || phase == '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };  

})
.directive('gestureOnHold',function($ionicGesture ) {
    return function(scope,element,attrs) {
        $ionicGesture.on('hold',function() {
            scope.$apply(function() {
                console.log("held");
                scope.$eval(attrs.gestureOnHold)
            });
        },element);
    }
});