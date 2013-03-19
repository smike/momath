
/** Config for the parse sdk. */
var ParseConfig = {
  APP_ID : 'yE5c0ZHODQcRVTGiRuTk6vYRi4384U9a5X9JCOv4',
  CLIENT_SECRET : 'deAh1DucQgEBgA3NWmHgDIm9UC29avdgnUrXHz9j'
};


/** Global keyboard shortcut declarations. */
var SHORTCUTS = {
  sporkview : {
    'esc sporkview': 'stopActivity',
    'shift+/ sporkview' : 'showHelp'
  },
  sporkstoryview : {
    'esc sporkstoryview': 'handleStopActivityRequest',
    'space sporkstoryview': 'handleStopActivityRequest',
    'shift+/ sporkstoryview' : 'showHelp'
  },
  birthdaysporkcollectionview : {
    'right' : 'handleNextSporkEvent'
  }
};


/** Spork app router. */
var AppRouter = Backbone.Router.extend({
  routes : {
    "" : "renderSplash",
    ":id" : "fetchSpork",
    "story/:id" : "fetchSporkStory",
    "birthday/:phoneNumber" : "renderBirthdayCollection"
  },
  
  initialized : false,
  birthdaySporkAssociationCollection : null,
  siteChrome : null,
  
  initializeLibs : function() {
    Parse.initialize(ParseConfig.APP_ID, ParseConfig.CLIENT_SECRET);
    this.initialized = true;
  },
  
  getSiteChrome : function() {
    if (!this.siteChrome) {
      this.siteChrome = new SiteChrome({});
    }
    return this.siteChrome;
  },
  
  renderSplash : function() {
    // No-op.
  },
  
  renderBirthdayCollection : function(phoneNumber) {
    if (!this.initialized) {
      this.initializeLibs();
    }
    
    if (!this.birthdaySporkAssociationCollection) {
      this.birthdaySporkAssociationCollection = new BirthdaySporkAssociationCollection();

      var query = new Parse.Query(ParseBirthdaySporkAssociation);
      query.equalTo("birthday_number", phoneNumber);
      
      this.birthdaySporkAssociationCollection.query = query
      this.birthdaySporkAssociationCollection.fetch({
        success : _.bind(function() {
          var birthdaySporkCollectionView = new BirthdaySporkCollectionView({
            model : this.birthdaySporkAssociationCollection
          });
          birthdaySporkCollectionView.render();
        }, this),
        error : _.bind(function(object, error) {
          this.handleError('This collection does not exist.');
        }, this)
      });
    }
  },

  fetchSpork : function(id, callback) {
    if (!this.initialized) {
      this.initializeLibs();
    }

    $('#wrapper').removeClass('hidden');
    $('#splash-wrapper').addClass('hidden');

    var query = new Parse.Query(ParseSpork);
    query.equalTo("status", "ACTIVE");
    query.get(id, {
      success: _.bind(function(spork) {
        this.clearViews();
        
        var isActive = spork.attributes.status == "ACTIVE"; 
        if (isActive) {
          this.renderSpork(spork);
        } else {
          this.handleError('This spork no longer exists.');
        }

        if (callback) {
          callback(isActive);
        }
      }, this),
      error: _.bind(function(object, error) {
        this.handleError('This spork does not exist.');
      }, this)
    });
  },
  
  renderSpork : function(spork) {
    var sporkView = new SporkView({
      model : spork
    });
    sporkView.render($('#spork-wrapper'));
  },
  
  fetchSporkStory : function(id, callback) {
    if (!this.initialized) {
      this.initializeLibs();
    }
    
    $('#wrapper').removeClass('hidden');
    $('#splash-wrapper').addClass('hidden');
    
    // TODO(gmike): Get the actual data.
    this.renderSporkStoryView();
  },
  
  renderSporkStoryView : function() {
    // TODO(gmike): Get rid of this shit.
    var storyAttributes = {
      title : "Mock story",
      description : "There was this time I loved you. Now I don't. I'm not sure I ever did, really.",
      linears : [
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/c00dd1e5-773f-4c99-9974-05a8f895bdfa-sporkphoto.1.png',
          elapsedTime : 2
        },
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/62a8072f-b12c-4a60-b5ae-502d417a16ee-sporkphoto.5.png',
          elapsedTime : 2
        },
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/c00dd1e5-773f-4c99-9974-05a8f895bdfa-sporkphoto.1.png',
          elapsedTime : 1
        },
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/62a8072f-b12c-4a60-b5ae-502d417a16ee-sporkphoto.5.png',
          elapsedTime : 1
        },
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/c00dd1e5-773f-4c99-9974-05a8f895bdfa-sporkphoto.1.png',
          elapsedTime : 2
        },
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/62a8072f-b12c-4a60-b5ae-502d417a16ee-sporkphoto.5.png',
          elapsedTime : 2
        },
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/c00dd1e5-773f-4c99-9974-05a8f895bdfa-sporkphoto.1.png',
          elapsedTime : 4
        },
        {
          type : 'photo',
          asset : 'http://files.parse.com/480b3e46-ffd8-4aba-89d4-aeff4684bd7e/62a8072f-b12c-4a60-b5ae-502d417a16ee-sporkphoto.5.png',
          elapsedTime : 1
        },
        {
          type : 'video',
          asset : 'http://techslides.com/demos/sample-videos/small.webm',
          elapsedTime : 6
        }
      ],
      audio : 'http://s3.amazonaws.com/audiojs/02-juicy-r.mp3'
    };
    var sporkStory = new ParseSporkStory(storyAttributes);
    
    var createStoryCallback = _.bind(function(story) {
      this.clearViews();
      var sporkStory = new SporkStoryView({
        model : story
      });
      sporkStory.render($('#spork-wrapper'));
    }, this);
    createStoryCallback(sporkStory);
    return;
  },
  
  clearViews : function() {
    $('#spork-wrapper').empty();
    $('#messaging-wrapper').empty();
  },
  
  handleError : function(message) {
    try {
      console.log(message);
    } catch(err) {
      // No-op.
    }
    
    this.clearViews();
    var messageView = new SiteMessageView();
    messageView.render($('#messaging-wrapper'), {
      'message' : message
    });
  }
});

app = new AppRouter();
Backbone.history.start();
