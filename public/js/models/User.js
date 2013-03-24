
/** A user registered with the API server. */
window.User = Backbone.Model.extend({
  urlRoot : "/api/content/person",

  url : function() {
    return "/api/content/person/" + this.id + "?detail=true";
  },

  defaults : {
    "id" : null,
    "PersonInfo" : ""
  }
});

/** TODO(gmike): Remove exammple response
{
   "PersonInfo":{
      "ID":"f201abda-0986-4e58-b9d3-dbb7f812d7cb",
      "FirstName":"Glen",
      "LastName":"Whitney",
      "Email":"whitney@momath.org",
      "Bio":0,
      "MemberStatus":0,
      "CurrentTag":null,
      "NumberOfVisits":45,
      "Language":{
         "Name":"English (United States)",
         "ID":"en-US"
      },
      "Math":{
         "Level":3,
         "Name":"Advanced"
      },
      "VisitHistory":{
         "Visit":[
            {
               "ID":"4e3b8260-e30b-48e5-8afd-6b349a05d584",
               "AssignedAt":"2013-03-23T16:54:47"
            },

            ...
         ]
      }
   }
}
*/
