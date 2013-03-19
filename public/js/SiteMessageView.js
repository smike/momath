
/** Displays a large message. */
window.SiteMessageView = Backbone.View.extend({
  initialize: function() {
    this.template = $("#message-view").html();
  },
  
  render : function(parentEl, data) {
    $(this.el).html(_.template(this.template, data));
    $(parentEl).append(this.el);  
  }
}); 
