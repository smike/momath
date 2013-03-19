
/** View and controller for a spork. */
window.BirthdaySporkCollectionView = Backbone.View.extend({
  sporkIndex : 0,
  
  initialize: function() {
    this.shortcuts = SHORTCUTS.birthdaysporkcollectionview;
    _.extend(this, new Backbone.Shortcuts);
    this.delegateShortcuts();
  },
  
  handleNextSporkEvent : function() {
    this.render();
  },

  render : function() {
    var sporkModel = this.model.models[this.sporkIndex];
    
    app.fetchSpork(sporkModel.attributes.spork, _.bind(function() {
      this.sporkIndex++;
      if (this.sporkIndex >= this.model.models.length) {
        this.sporkIndex = 0;
      }
      
      $('#collection-next').removeClass('hidden');
      $('#collection-next').bind('click', _.bind(this.handleNextSporkEvent, this));
    }, this));
  }
});
