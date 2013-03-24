



function log(message) {
  try {
    console.log(message);
  } catch (err) {
    // No-op.
  }
}

function formatEpochDateTime(dateEpochString, format) {
  if (!format) {
    format = "MMMM d yyyy, hh:mma";
  }
 
  return $.format.date(new Date(parseInt(dateEpochString, 10)).toString(), format);
}


function formatDateTime(dateString, format) {
  if (!format) {
    format = "MMMM d yyyy, hh:mma";
  }
 
  return $.format.date(new Date(dateString).toString(), format);
}


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

  render : function(eventName) {
    $(this.el).html(this.template(this.model.attributes.PersonInfo));
    return this;
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

  render : function(eventName) {
    var entry = this.model.toJSON();
    entry.FormattedAssignedAt = formatDateTime(entry.AssignedAt);

    $(this.el).html(this.template(entry));
    return this;
  },

  close : function() {
    $(this.el).unbind();
    $(this.el).remove();
  }
});


/** An overview of the user's visit history. */
window.VisitHistoryView = Backbone.View.extend({
  el : $('#visits'),
  
  initialize: function() {
    this.model.bind('reset', this.render, this);
  },

  render : function(eventName) {
    $(this.el).empty();
    
    this.renderElements();

    return this;
  },
  
  renderElements : function() {
    _.each(this.model.models, function(visitEntry) {
      $(this.el).append(new VisitHistoryEntryView({
        model : visitEntry
      }).render().el);
    }, this);
  }
});


/** Routes application. */
var AppRouter = Backbone.Router.extend({
  routes : {
    "user/:id" : "renderCreationBoard"
  },
  
  renderCreationBoard : function(id) {
  	var user = new User({id: id});
    user.fetch({
      success : _.bind(function (data) {
        $('#user-card .inner').html(new UserCardView({model:data}).render().el);

        var visitHistoryCollection = new VisitHistoryCollection(data.attributes.PersonInfo.VisitHistory.Visit, {});

        var visitHistoryView = new VisitHistoryView({
          model : visitHistoryCollection
        });
        visitHistoryView.render();

        /*this.feedElementList = new FeedElementCollection(user.id);
        this.feedElementList.fetch({
          success : _.bind(function () {
            this.feedView = new FeedView({
              model : this.feedElementList
            });

            this.feedElementList.setFeedView(this.feedView);
            this.feedView.render();
          }, this)
        });*/
      }, this)
    });
  }
});

var adhocTemplates = [
  'user.profile.card',
  'visit.history.entry'
];

tpl.loadTemplates(adhocTemplates, function() {
  app = new AppRouter();
  Backbone.history.start();
});
