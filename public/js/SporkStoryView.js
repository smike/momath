/** View and controller for a spork story. */
window.SporkStoryView = window.BaseSporkView.extend({
  events: {},
  
  inlineTemplates : {
    photoLinear : "<div class='linear'><img src='<%= asset %>' /></div>"
  },
  
  // Number of assets to preload
  preloadBatchSize : 15,
  
  // Story event bus,
  eventBus : null,
  
  tags : [],
  tagDefMap : {},
  photoHeight : null,
  mediaColHeight : null,
  audioPlayer : null,
  videoPlayer : null,

  initialize: function() {
    this.template = $("#spork-story").html();
    
    this.eventBus = new EventBus();
  },

  getShortcuts : function() {
    return SHORTCUTS[this.getKeyScope()];
  },

  getKeyScope : function() {
    return "sporkstoryview";
  },

  setAudioPlayer : function(audioPlayer) {
    this.audioPlayer = audioPlayer;
  },

  close: function() {
    $(this.el).unbind();
    $(this.el).empty();
  },

  render : function(wrapperEl) {
    this.populateEventBus();
    this.preloadAssets();
    
    this.el = wrapperEl;
    $(this.el).html(_.template(this.template, this.model.toJSON()));
    
    $(this.el).find('#poster').bind('click', _.bind(this.handleBeginStory, this));
    
    // Display play button
    // Render poster image
    // Pre-load first X linear assets
    // this.renderTimeline(linears);
    // this.bindControls();
    // Initialize audip player, load narration
    
    this.initializeVideoPlayer();
    this.initializeAudioPlayer();
    
    app.getSiteChrome()
        .registerActiveSpork(this)
        .updatePageTitle(this.model.attributes.title);
  },
  
  populateEventBus : function() {
    // Add linears.
    var elapsedTime = 0;
    _.each(this.model.attributes.linears, function(linear, index) {
      var eventIndex = Math.floor(elapsedTime * 10) / 10 * 1000;
      
      var event = new EventBusCallback();
      event.setEvent(eventIndex, _.bind(this.displayLinear, this, linear));
      if (index + 5 >= this.preloadBatchSize) {
        event.setPreEvent(
            eventIndex - 5 * 1000,
            _.bind(this.preloadAsset, this), linear.type, linear.asset);
      }
      
      this.eventBus.addEvent(event);
      
      elapsedTime += linear.elapsedTime;
    }, this);
    
    // Create event to play audio.
    var audioPlaybackEvent = new EventBusCallback();
    audioPlaybackEvent.setEvent(0, _.bind(function(audioAsset) {
      this.audioPlayer.source.src = audioAsset;
      // $('#audio-wrapper').removeClass('hidden');
      this.audioPlayer.play();
    }, this, this.model.attributes.audio));
    this.eventBus.addEvent(audioPlaybackEvent);
  },
  
  preloadAssets : function() {
    // Preload audio
    this.preloadAsset("audio", this.model.attributes.audio);
    
    _.each(this.model.attributes.linears, function(linear, index) {
      if (index < this.preloadBatchSize) {
        this.preloadAsset(linear.type, linear.asset);
      }
    }, this);
  },
  
  preloadAsset : function(type, asset) {
    if (type == "photo") {
      $('<img />')[0].src = asset;
    } else if (type == "video") {
      $('<video />')[0].src = asset;
    } else if (type == "audio") {
      $('<audio />')[0].src = asset;
    } else {
      // No-op.
    }
  },
  
  /**
   * Binds the next, previous controls to linear modification operations
   */
  bindControls : function() {
    
  },
  
  displayLinear : function(linear) {
    console.log("Should display linear: " + linear.type);

    if (linear.type == "photo") {
      $('#linear-wrapper')
          .empty()
          .html(_.template(this.inlineTemplates.photoLinear, linear));
    } else if (linear.type == "video") {
      // TODO(gmike): Implement this.
    } else {
      // No-op.
    }
  },
  
  startStory : function() {
    this.eventBus.start();
  },
  
  pauseStory : function() {
    this.eventBus.pause();
    this.audioPlayer.pause();
  },
  
  /**
   * Interrupts story playback
   */
  handleInterruption : function() {
    
  },
  
  handleBeginStory : function() {
    this.startStory();
  },
  
  handleStopActivityRequest : function() {
    this.pauseStory();
  }
});
