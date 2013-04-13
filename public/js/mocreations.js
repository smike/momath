
/** IDs for exhbits the create things we want to render. */
var EXHIBIT_IDS = [
  'MTHN.OD',
  'HUTR.OD',
  'LOGE.OD',
  'POPA.OD',
  'TIFA.OD'
];

/** Known image file name extensions and their MIME types. */
var IMAGE_MIME_TYPES = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg'
};

var EXTENSION_3DS = '3ds';

/** Renders a card view of a creation. */
window.CreationCardView = Backbone.View.extend({
  initialize : function() {
    this.template = _.template(tpl.get('creation.card'));
  },

  getBlobUrl_ : function(creation, blobId, mimeType) {
    var url = '/api/content/exhibit-blob/' +
        [creation.exhibitId, creation.visitId, blobId].join('/');
    if (mimeType) {
      url += "?type=" + mimeType;
    }
    return url;
  },

  render : function(wrapper, creation) {
    switch (creation.exhibitId) {
      case "HUTR.OD":
      case "POPA.OD":
      case "TIFA.OD":
      case "HUTR.OD":
      case "MTHN.OD":
        this.renderMTHN(wrapper, creation);
        break;
      default:
        console.error("Unknown exhibit: " + creation.exhibitId);
    }
  },

  renderMTHN : function(wrapper, creation) {
    var imageUrl = null;
    _.find(creation.getBlobIds(), function(blobId) {
      var extension = blobId.substr(blobId.lastIndexOf(".") + 1);
      var mimeType = IMAGE_MIME_TYPES[extension];
      if (mimeType) {
        imageUrl = this.getBlobUrl_(creation, blobId, mimeType);
        return true;
      }
    }, this);
    var blob_3ds = null;
    var attrs = {
      ExhibitName: creation.attributes.ExhibitBlobList.ExhibitID,
      blobs: _.map(creation.getBlobIds(), function(blobId) {
        var extension = blobId.substr(blobId.lastIndexOf(".") + 1);
        var blobName = blobId;
        if (IMAGE_MIME_TYPES.hasOwnProperty(extension)) {
          blobName = "Image";
        } else if (EXTENSION_3DS == extension) {
          blobName = "3D Model";
          blob_3ds = blobId;
        }
        return {
          name: blobName,
          url: this.getBlobUrl_(creation, blobId)
        };
      }, this),
      id: imageUrl
    };
    this.el = $(this.template(attrs))[0];
    cropImageData(imageUrl, $(this.el).find('canvas')[0], 10, 10);

    wrapper.appendChild(this.el);

    if (blob_3ds) {
      var renderUrl = "/render-3ds#" + [creation.exhibitId, creation.visitId, blob_3ds].join('/');
      $(this.el).find('canvas').colorbox({
        // Using the native iframe view doesn't work quite well: the iframe
        // doesn't take up the whole lightbox.
        html: '<iframe style="width: 100%; height:100%;" src="'+renderUrl+'"></iframe>',
        innerWidth: "80%",
        height: "80%",
      });
    }
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
      creationCard.render(creationWrapper, creation);
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
  this.creationCollectionViews = {};

  /** Number of outstanding collections needed to be fetched per visit. */
  this.creationsToFetch = {};

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
  this.creationsToFetch[visitId] = EXHIBIT_IDS.length;

  _.each(EXHIBIT_IDS, function(exhibitId) {
    log("Fetching creation for: " + this.user.id + " // " + exhibitId);

    if (!this.creations.hasOwnProperty(visitId)) {
      this.creations[visitId] = {};
    }
    this.creations[visitId][exhibitId] = new Creation({
      visitId : visitId,
      exhibitId : exhibitId
    });
    this.creations[visitId][exhibitId].fetch({
      success: _.bind(function () {
        this.handleCreationFetchResponse(visit, exhibitId);
      }, this)
    });
  }, this);
};

CreationManager.prototype.handleVisitCreationsLoadRequest = function(visit) {
  var visitId = visit.attributes.ID;
  if (this.creationsToFetch.hasOwnProperty(visitId) && this.creationsToFetch[visitId] !== 0) {
    return;
  }

  this.fetchCreationsForVisit_(visit);
};

CreationManager.prototype.handleCreationFetchResponse = function(visit, exhibitId) {
  var visitId = visit.attributes.ID;
  var creation = this.creations[visitId][exhibitId];

  this.creationsToFetch[visitId]--;
  if (creation.getBlobIds().length == 0) {
    // The server will always return a creation. If there aren't any blobs we
    // can assume that there was no creation.
    delete this.creations[visitId][exhibitId];
  }

  if (this.creationsToFetch[visitId] === 0) {
    this.renderCreations(visit, this.creations[visitId]);
  }
};

CreationManager.prototype.renderCreations = function(visit, creations) {
  var visitId = visit.attributes.ID;
  log("Should render creations for visit: " + visitId+ ", " + creations.length);

  var creationCollectionView = new CreationCollectionView();
  creationCollectionView.render(visit, creations);

  this.creationCollectionViews[visitId] = creationCollectionView;
  this.visitHistoryView.setVisitLoaded(visit);
};

// CreationManager.prototype.blah = function() {};
