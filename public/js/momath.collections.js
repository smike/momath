
/** A collection of visit history entries. */
window.VisitHistoryCollection = Backbone.Collection.extend({
  model : VisitHistoryEntry
});


/** A collection of creations. */
window.CreationCollection = Backbone.Collection.extend({
  model : Creation,

  exhibitId : null,
  visitId : null,

  initialize : function(models, properties) {
    this.exhibitId = properties.exhibitId;
    this.visitId = properties.visitId;
  },

  url : function() {
    return '/api/content/exhibit-blob-list/' + this.exhibitId + '/' + this.visitId;
  }
});
