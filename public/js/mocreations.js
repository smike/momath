
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
  modalRender : true,

  initialize : function(attrs) {
    this.template = _.template(tpl.get('creation.card'));
    this.modalRender = attrs.modalRender;
  },

  getBlobUrl_ : function(creation, blobId, mimeType) {
    var url = '/api/content/exhibit-blob/' +
        [creation.exhibitId, creation.visitId, blobId].join('/');
    if (mimeType) {
      url += "?type=" + mimeType;
    }
    return url;
  },

  getCreationPermaLink : function(creation) {
    return '/#creation/' + creation.exhibitId + "/" + creation.visitId;
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

    // Adds flip effect.
    $(this.el).bind('click', function(event) {
      if (event.target.tagName == "CANVAS") {
        return;
      }
      $(this).toggleClass('flip')
    });
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
      creationPageUrl : this.getCreationPermaLink(creation),
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
      var iframed3DModelSnippet = '<iframe style="width: 100%; height:100%;" src="' + renderUrl + '"></iframe>';

      if (this.modalRender) {
        $(this.el).find('canvas').colorbox({
          // Using the native iframe view doesn't work quite well: the iframe
          // doesn't take up the whole lightbox.
          html: iframed3DModelSnippet,
          innerWidth: "80%",
          height: "80%",
        });
        $(this.el).find('.icon-fullscreen').bind('click', _.bind(function(event) {
          $(this.el).find('canvas').click();
          return false;
        }, this));
      } else {
        $(this.el).find('canvas').bind('click', _.bind(this.render3DModelInline, this, wrapper, iframed3DModelSnippet));
        $(this.el).find('.icon-fullscreen').bind('click', _.bind(this.render3DModelInline, this, wrapper, iframed3DModelSnippet));
      }
    }
  },

  render3DModelInline : function(wrapper, iframed3DModelSnippet) {
    $(this.el).addClass('hidden');

    var height = $(window).height() - 144;

    var el = $('<div id="inline-model-wrapper">' + iframed3DModelSnippet + '</div>')[0];
    $(el).height(height + 'px');
    wrapper.appendChild(el);
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
    var creationCount = 0;
    _.each(creations, function(creation) {
      creationCount++;
    });

    var timestamp = new Date(visit.attributes.AssignedAt).toString();
    var visitInfo = {
      VisitMonth : $.format.date(timestamp, 'MMMM'),
      VisitDay: $.format.date(timestamp, 'd'),
      VisitYear: $.format.date(timestamp, 'yyyy'),
      FormattedAssignedAt : formatDateTime(visit.attributes.AssignedAt),
      CreationCount : creationCount
    };

    this.el = $(this.template(visitInfo))[0];
    this.wrapperEl.appendChild(this.el);
    var creationWrapper = $(this.el)[0];
    _.each(creations, function(creation) {
      var creationCard = new CreationCardView({
        modalRender : true
      });
      creationCard.render(creationWrapper, creation);
    });

    // Adds flip effect to date cards.
    $(this.el).find('.date-card').bind('click', function(event) {
      if (event.target.tagName == "CANVAS") {
        return;
      }
      $(this).toggleClass('flip')
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
