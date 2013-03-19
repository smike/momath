
/** View and controller for a spork. */
window.SporkView = window.BaseSporkView.extend({
  events: {},
  
  tags : [],
  tagDefMap : {},
  photoHeight : null,
  mediaColHeight : null,
  audioPlayer : null,
  videoPlayer : null,
  
  initialize: function() {
    this.template = $("#spork").html();
  },
  
  getShortcuts : function() {
    return SHORTCUTS[this.getKeyScope()];
  },

  getKeyScope : function() {
    return "sporkview";
  },

  close: function() {
    $(this.el).unbind();
    $(this.el).empty();
    this.unbindShortcuts();
  },

  render : function(parentEl) {
    $(this.el).html(_.template(this.template, this.model.toJSON()));
    $(parentEl).append(this.el);
    
    this.renderTagsOnImage();

    $('#media-escape').bind('click', _.bind(this.stopActivity, this));
    
    this.initializeVideoPlayer();
    this.initializeAudioPlayer();
    
    app.getSiteChrome()
        .registerActiveSpork(this)
        .updatePageTitle(this.model.attributes.title);
  },
  
  renderTagsOnImage : function() {
    var tags = this.model.attributes.tags.split(',');
    _.each(tags, function(tag) {
      var query = new Parse.Query(ParseSporkTag);
      query.get(tag, {
        success: _.bind(function(sporkTag) {
          this.tagDefMap[sporkTag.id] = sporkTag;
          this.renderTag(sporkTag);
        }, this),
        error: function(object, error) {
          // The object was not retrieved successfully.
          // error is a Parse.Error with an error code and description.
        }
      });
    }, this);
  },

  renderTag : function(sporkTag) {
    var attrs = sporkTag.attributes;
    var imageTag = $('<div></div>')
      .addClass("image-tag")
      .css({
        'top' : parseInt(attrs.coord_y * 100, 10) + '%',
        'left' : parseInt(attrs.coord_x * 100, 10) + '%'
      });
    
    var sporkTagDef = sporkTag;
    imageTag.bind('click', _.bind(function() {
      this.handleImageTagClick(sporkTagDef, sporkTag);
    }, this));
    
    $(this.el).find('.image-wrapper').append(imageTag);
    
    this.tags.push(imageTag);
  },

  handleQuickHotspotClick : function() {
    this.messageUser("This changes the color of the tags subtly.");
    _.each(this.tags, function(tag) {
      tag.toggleClass('loud-tag');
    });
  },
  
  handleShareClick : function() {
    this.messageUser("This isn't implemented.");
  },
  
  handleImageTagClick : function(sporkTagDef, sporkTag) {
    if (this.activeTag) {
      this.activeTag.stop();
     
      // This constitutes a toggle.
      if (this.activeTag.el == sporkTag) {
        this.activeTag = null;
        return;
      }
      
      this.activeTag = null;
    }
    
    var attrs = sporkTagDef.attributes;
    if (attrs.type == "VIDEO") {
      this.videoPlayer.src = attrs.asset_url;      
      this.toggleColumnStates(_.bind(function() {
        try {
          this.videoPlayer.play();  
        } catch (err) {
          this.messageUser(err);
        }
      }, this));
      
      this.activeTag = {
          def : sporkTagDef,
          el : sporkTag,
          stop : _.bind(function() {
            this.toggleColumnStates();
            this.videoPlayer.pause();
          }, this)
        };
    } else if(attrs.type == "AUDIO") {
      this.audioPlayer.source.src = attrs.asset_url;
      $('#audio-wrapper').removeClass('hidden');
      this.audioPlayer.play();
      
      this.activeTag = {
        def : sporkTagDef,
        el : sporkTag,
        stop : _.bind(function() {
          this.audioPlayer.pause();
          $('#audio-wrapper').addClass('hidden');
        }, this)
      };
    }
  },
  
  stopActivity : function() {
    if (this.activeTag) {
      this.activeTag.stop();
      this.activeTag = null;
    }
  },
  
  toggleColumnStates : function(onComplete) {
    if (!this.photoHeight) {
      this.mediaColHeight = $('.media-column').height();
      this.photoHeight = $('.image-wrapper').height();
    }
    
    var mediaColHeight = this.mediaColHeight;
    // Going big
    if (!$('.media-column').hasClass('media-column-big')) {
      mediaColHeight = this.photoHeight;
      window.setTimeout(_.bind(function() {
        $('.video-player-wrapper').css({'opacity' : 1});
        $(this.videoPlayer).css({
          'display' : 'block'
        });
        if (onComplete) {
          onComplete();
        }
      }, this), 500);
    } else {
      $('.video-player-wrapper').css({'opacity' : 0});
      $(this.videoPlayer).css({
        'display' : 'none',
        'margin-top' : '0px'
      });
      $('.media-columnn').css({'display' : 'block'}); 
    }
    
    $('.media-column').css({'height' : mediaColHeight + 'px'});
    $('.image-wrapper').toggleClass('image-wrapper-little');
    $('.media-column').toggleClass('media-column-big');
  }
});
