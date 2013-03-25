
/** A visit registered with the API server. */
window.VisitHistoryEntry = Backbone.Model.extend({
  urlRoot : "/api/content/visit",

  url : function() {
    return "/api/content/visit/" + this.id + "?detail=true";
  },

  defaults : {
    "id" : null,
    "VisitInfo" : ""
  }
});

/** TODO(gmike): Remove example visit history entry.
{
   "VisitInfo":{
      "ID":"e8e81305-25f9-42d0-acd9-32fcb044949d",
      "AssignedAt":"2013-03-18T17:28:17-04:00",
      "PersonID":"f201abda-0986-4e58-b9d3-dbb7f812d7cb",
      "Language":{
         "Name":"English (United States)",
         "ID":"en-US",
         "IsDefault":false
      },
      "Math":{
         "Level":1,
         "Name":"Basic",
         "IsDefault":false
      },
      "ExhibitVisitList":{

      },
      "ExhibitContent":{

      }
   }
}
*/
