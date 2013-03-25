
/** A user's creation. */
window.Creation = Backbone.Model.extend({
  exhibitId : null,
  visitId : null,

  url : function() {
    return '/api/content/exhibit-blob-list/' + this.exhibitId + '/' + this.visitId + '/' + this.id;
  },

  defaults : {
    'id' : null,
    'ExhibitBlobList' : ''
  }
});

/** TODO(gmike): Remove example requests

http://localhost:3000/api/content/exhibit-blob-list/MTHN.OD/2acddc90-c378-4e33-8b13-a25db4d67c37

{
   "ExhibitBlobList":{
      "ExhibitID":"MTHN.OD",
      "VisitID":"2acddc90-c378-4e33-8b13-a25db4d67c37",
      "Blob":[
         {
            "ID":"poly_000.3ds"
         },
         {
            "ID":"poly_000.png"
         },
         {
            "ID":"poly_000.zip"
         }
      ]
   }
}

*/
