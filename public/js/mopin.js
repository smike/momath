

var DEFAULT_DATE_FORMAT = 'MMMM d yyyy, hh:mma';
var DEBUG = true;


/** Renders a glimpse of a user's profile. */
window.UserCardView = Backbone.View.extend({
  events: {},

  initialize: function() {
    this.template = _.template(tpl.get('user.profile.card'));
  },

  close: function() {
    $(this.el).unbind();
    $(this.el).empty();
  },

  render : function(wrapperEl) {
    this.el = wrapperEl;

    $(this.el).html(this.template(this.model.attributes.PersonInfo));
  }
});


/** Renders information about a single visit. */
window.VisitHistoryEntryView = Backbone.View.extend({
  tagName : 'li',

  initialize : function() {
    this.template = _.template(tpl.get('visit.history.entry'));

    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.close, this);
  },

  render : function(creationManager, wrapper) {
    var entry = this.model.toJSON();
    entry.FormattedAssignedAt = formatDateTime(entry.AssignedAt);

    $(this.el).html(this.template(entry));
    wrapper.append(this.el);

    $(this.el).bind('click', _.bind(creationManager.handleVisitCreationsLoadRequest, creationManager, this.model));
  },

  close : function() {
    $(this.el).unbind();
    $(this.el).remove();
  },

  setLoaded : function() {
    $(this.el).addClass('collection-loaded');
  }
});


/** An overview of the user's visit history. */
window.VisitHistoryView = Backbone.View.extend({
  el : null,
  creationManager : null,
  entryViews : {},

  initialize: function(properties) {
    this.model = properties.model;
    this.creationManager = properties.creationManager;

    this.el = $('#visits');
    this.model.bind('reset', this.render, this);
  },

  render : function() {
    $(this.el).empty();

    _.each(this.model.models, function(visitEntry) {
      var entryView = new VisitHistoryEntryView({
        model : visitEntry
      });

      entryView.render(this.creationManager, $(this.el))
      this.entryViews[visitEntry.attributes.ID] = entryView;
    }, this);

    return this;
  },

  setVisitLoaded : function(visit) {
    this.entryViews[visit.attributes.ID].setLoaded();
  }
});


/** Routes application. */
var AppRouter = Backbone.Router.extend({
  routes : {
    "" : "renderMain",
    "user/:id" : "lookupUserAndRenderCreationBoard",
    "creation/:exhibitId/:visitId" : "lookupAndRenderCreation"
  },

  renderMain : function() {
    $('#content').html('<div class="message">MoMath. Coming Soon.</div>');
  },

  _isEmail : function(string) {
    return string.indexOf("@") != -1;
  },

  _getPersonId : function (email, callback) {
    var lookup_json = {"Person": {"Identity": email}};
    $.post('/api/content/lookup-person', lookup_json, function(person_json) {
      var person_id = person_json.VisitInfo.PersonID;
      console.log("person id for " + email + ": " + person_id);
      callback(person_id);
    });
  },

  lookupAndRenderCreation : function(exhibitId, visitId) {
    console.log("Exhibit: " + exhibitId + ", Visit: " + visitId);
    
    // Clears the content body.
    $('#content').html('');

    var creation = new Creation({
      exhibitId : exhibitId,
      visitId : visitId
    });
    creation.fetch({
      success : _.bind(function (fetchedCreation) {
        console.log(fetchedCreation);
        var creationCard = new CreationCardView({});
        creationCard.render($('#content')[0], fetchedCreation);
      }, this)
    });

    /*
    $.get('/api/content/exhibit-blob-list/' + exhibit_id + '/' + visit_id, function(blobs_json) {
            var exhibit_bob_list = blobs_json.ExhibitBlobList;
            var blobs = exhibit_bob_list["Blob"]; // May be missing if no blobs
            if (blobs) {
              // A single entry looks doesn't end up in an array in the json.
              blobs = $.isArray(blobs) ? blobs : [blobs];
              var blob_ids = [];
              for (var j in blobs) {
                var blob_id = blobs[j].ID;
                blob_ids.push(blob_id);
              }
              log('blobs found at ' + exhibit_bob_list.ExhibitID + ' for ' + visit_id + ': ' + blob_ids);
              callback(visit_id, exhibit_bob_list.ExhibitID, blob_ids);
            }
          });*/
  },

  lookupUserAndRenderCreationBoard : function(id) {
    if (this._isEmail(id)) { // perhaps this should only be done for debugging
      this._getPersonId(id, function(person_id) {
        this.renderCreationBoard(person_id);
      }.bind(this));
    } else {
      this.renderCreationBoard(id);
    }
  },

  renderCreationBoard : function(id) {
    $('#content').html(_.template($('#content-chrome').html()));

  	var user = new User({id: id});
    user.fetch({
      success : _.bind(function (userData) {
        var userCardView = new UserCardView({model: userData});
        userCardView.render($('#user-card .inner'));

        var visitHistoryCollection = new VisitHistoryCollection(userData.attributes.PersonInfo.VisitHistory.Visit, {});
        var creationManager = new CreationManager(userData, visitHistoryCollection);
        creationManager.initialize();

        var visitHistoryView = new VisitHistoryView({
          model : visitHistoryCollection,
          creationManager : creationManager
        });

        // TODO(gmike): These dependencies are probably messier than they should be.
        creationManager.setVisitHistoryView(visitHistoryView);
        visitHistoryView.render();
        creationManager.fetchCreations();
      }, this)
    });
  }
});

var adhocTemplates = [
  'user.profile.card',
  'visit.history.entry',
  'creation.collection',
  'creation.card'
];

tpl.loadTemplates(adhocTemplates, function() {
  app = new AppRouter();
  Backbone.history.start();
});
