











var AppRouter = Backbone.Router.extend({
  routes : {
    "" : "renderCreationBoard"
  },
  
  renderCreationBoard : function() {
  	
  }
});

app = new AppRouter();
Backbone.history.start();
