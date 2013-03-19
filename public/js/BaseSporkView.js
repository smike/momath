
/** Base view and helper methods for spork views. */
window.BaseSporkView = Backbone.View.extend({
  handleQuickHotspotClick : function() {
    _.each(this.getActiveTags(), function(tag) {
      tag.toggleClass('loud-tag');
    });
  },
  
  initializeAudioPlayer : function() {
    // Initialize and set audio player
    audiojs.events.ready(_.bind(function() {
      var audioPlayers = audiojs.createAll();
      if (audioPlayers.length == 0) {
        throw "Error: Audio player unavailable.";
      }
      this.setAudioPlayer(audioPlayers[0]);
    }, this));
  },
  
  initializeVideoPlayer: function() {
    // Initialize the video player.
    this.videoPlayer = $('video')[0];
  },
  
  setAudioPlayer : function(audioPlayer) {
    if (audioPlayer == null) {
      throw "Audio player null!";
    }
    this.audioPlayer = audioPlayer;
  },
  
  getActiveTags : function() {
    return [];
  },
  
  messageUser : function(message) {
    var message = $('<li class="offscreened">' + message + '<span class="remove">&times;</span></li>')
      .addClass("message");
  
    message.bind('click', function() {
      $(this).addClass('offscreened');
      setTimeout(function() {
        $(message).remove();
      }, 500);
    });
  
    $('#user-messages').prepend(message);
    message.removeClass('offscreened');
  },
  
  showHelp : function() {
    this.messageUser("Help is not yet implemented.");
  },
  
  unbindShortcuts : function() {
    key.deleteScope(this.getKeyScope());
  },
  
  bindShortcuts : function() {
    _.extend(this, new Backbone.Shortcuts);
    this.shortcuts = this.getShortcuts();
    this.delegateShortcuts();
    key.setScope(this.getKeyScope());
  },
  
  getKeyScope : function() {
    return "basespork";
  }
});
