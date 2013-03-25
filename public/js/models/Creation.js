
/** A user's creation. */
window.Creation = Backbone.Model.extend({
  exhibitId : null,
  visitId : null,

  initialize : function(properties) {
    this.exhibitId = properties.exhibitId;
    this.visitId = properties.visitId;
  },

  url : function() {
    return '/api/content/exhibit-blob-list/' + this.exhibitId + '/' + this.visitId;
  },

  getBlobIds : function() {
    var exhibitBlobList = this.attributes.ExhibitBlobList;
    if (!exhibitBlobList.hasOwnProperty('Blob')) {
      return [];
    }

    // the xml2json library is a bit funky. If it sees only one Blob node it
    // will not create an array for it.
    var blobs = _.flatten([exhibitBlobList.Blob]);
    return _.map(blobs, function(blob) { return blob.ID; });
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
