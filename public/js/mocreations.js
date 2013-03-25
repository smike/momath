
/** IDs for exhbits the create things we want to render. */
var EXHIBIT_IDS = [
  'MTHN.OD',
  'HUTR.OD',
  'LOGE.OD',
  'POPA.OD',
  'TIFA.OD'
];


/** Renders a card view of a creation. */
window.CreationCardView = Backbone.View.extend({
  initialize : function() {
    this.template = _.template(tpl.get('creation.card'));
  },

  render : function(wrapper) {
    var attrs = {};
    this.el = $(this.template(attrs))[0];
    wrapper.appendChild(this.el);
  }
});

/*** Renders a collection of creations for a given date. */
window.CreationCollectionView = Backbone.View.extend({
  events: {},

  initialize: function() {
    this.template = _.template(tpl.get('creation.collection'));
    this.wrapperEl = $('#creations-wrapper')[0];
  },

  close: function() {
    $(this.el).unbind();
    $(this.el).empty();
  },

  render : function(visit, creations) {
    var visitInfo = {
      FormattedAssignedAt : formatDateTime(visit.attributes.AssignedAt)
    };

    this.el = $(this.template(visitInfo))[0];
    this.wrapperEl.appendChild(this.el);
    var creationWrapper = $(this.el).find('.creations')[0];
    _.each(creations, function(creation) {
      var creationCard = new CreationCardView({});
      creationCard.render(creationWrapper);
    });
  }
});

/** Manages fetching and merging disparate collections of creations. */
function CreationManager(user, visits) {
  /** Backbone user model. */
  this.user = user;

  /*** All user visits. */
  this.visits = visits;

  /** All creations across exhibits by visit id. */
  this.creations = {};

  /** All creations across exhibits by visit id. */
  this.creationViews = {};

  /** Creation collections by visit id and exhibit id. */
  this.creationCollections = {};

  /** Number of outstanding collections needed to be fetched per visit. */
  this.collectionsToFetch = {};

  /** A view of the visit history. */
  this.visitHistoryView = null;
};

CreationManager.prototype.initialize = function() {
  // TODO(gmike): Figure out if this is necessary.
};

CreationManager.prototype.setVisitHistoryView = function(visitHistoryView) {
  this.visitHistoryView = visitHistoryView;
};

CreationManager.prototype.fetchCreations = function() {
  var visit = this.visits.models[0];
  
  this.fetchCreationsForVisit_(visit);
};

/** Fetches all creations from creation-making exhibits for the provided visit. */
CreationManager.prototype.fetchCreationsForVisit_ = function(visit) {
  var visitId = visit.attributes.ID;
  this.collectionsToFetch[visitId] = EXHIBIT_IDS.length;

  _.each(EXHIBIT_IDS, function(exhibitId) {
    log("Fetching creations for: " + this.user.id + " // " + exhibitId);

    this.creationCollections[exhibitId] = new CreationCollection([], {
      visitId : visitId,
      exhibitId : exhibitId
    });
    this.creationCollections[exhibitId].fetch({
      success : _.bind(function () {
        this.handleCollectionFetchResponse(visit, exhibitId);
      }, this)
    });
  }, this);
};

CreationManager.prototype.handleVisitCreationsLoadRequest = function(visit) {
  var visitId = visit.attributes.ID;
  if (this.collectionsToFetch.hasOwnProperty(visitId) && this.collectionsToFetch[visitId] !== 0) {
    return;
  }

  this.fetchCreationsForVisit_(visit);
};

CreationManager.prototype.handleCollectionFetchResponse = function(visit, exhibitId) {
  var visitId = visit.attributes.ID;

  this.collectionsToFetch[visitId]--;
  if (this.collectionsToFetch[visitId] === 0) {
    this.mergeAndRenderCreations(visit);
  }
};

CreationManager.prototype.mergeAndRenderCreations = function(visit) {
  var visitId = visit.attributes.ID;

  var all = []
  _.each(EXHIBIT_IDS, function(exhibitId) {
    var models = this.creationCollections[exhibitId].models;
    all = _.union(all, models);
  }, this);

  this.creations[visitId] = all;
  this.renderCreations(visit, all);
};

CreationManager.prototype.renderCreations = function(visit, creations) {
  var visitId = visit.attributes.ID;
  log("Should render creations for visit: " + visitId+ ", " + creations.length);

  var creationCollectionView = new CreationCollectionView();
  creationCollectionView.render(visit, creations);

  this.creationViews[visitId] = creationCollectionView;
  this.visitHistoryView.setVisitLoaded(visit);
};

// CreationManager.prototype.blah = function() {};
