
/** View of site chrome. */
window.SiteChrome = Backbone.View.extend({
  activeSporkView : null,
  
  initialize : function() {
    $('#action-quickhotspot').bind('click', _.bind(this.handleQuickHotspotClick, this));
    $('#action-share').bind('click', _.bind(this.handleShareClick, this));
  },
  
  registerActiveSpork : function(activeSporkView) {
    if (this.activeSporkView) {
      this.activeSporkView.close();
    }
    this.activeSporkView = activeSporkView;
    this.activeSporkView.bindShortcuts();
    return this;
  },
  
  updatePageTitle : function(title) {
    document.title = "spork.fm | " + title;
    return this;
  },
  
  handleQuickHotspotClick : function() {
    this.activeSporkView.handleQuickHotspotClick();
  },
  
  handleShareClick : function() {
    this.activeSporkView.handleShareClick();
  }
});
