
/** An event bus. Fires events and pre-events at prescribed times. */
var EventBus = function() {
  this.eventMap_ = {};
  this.timeouts_ = {};
  this.timeoutInterval_ = 100;  // In ms.
  this.intervalCount_ = null;
  this.state_ = null;
  
  this.reset();
};

EventBus.prototype.addEvent = function(eventBusCallback) {
  this.addToEventStack_(eventBusCallback.getEventTimeIndex(), eventBusCallback.getEventCallback());
  
  if (eventBusCallback.hasPreEventCallback()) {
    this.addToEventStack_(eventBusCallback.getEventTimeIndex(), eventBusCallback.getEventCallback());  
  }
};

EventBus.prototype.start = function() {
  if (this.timeouts_.main) {
    throw "Event bus already started";
  }

  this.fireEvents();
  this.timeouts_.main = window.setInterval(_.bind(this.checkEvents, this), this.timeoutInterval_);
};

EventBus.prototype.pause = function() {
  this.state_ = EventBusState.PAUSED;
}

EventBus.prototype.reset = function() {
  if (this.timeouts_.main) {
    window.clearInterval(this.timeouts_.main);
  }
  
  this.intervalCount_ = 0;
  this.state_ = EventBusState.RESET;
};

EventBus.prototype.checkEvents = function() {
  if (this.state_ == EventBusState.PAUSED) {
    return;
  }

  this.intervalCount_++;
  this.fireEvents();
};

EventBus.prototype.fireEvents = function() {
  var index = this.intervalCount_ * this.timeoutInterval_;
  if (this.eventMap_.hasOwnProperty(index)) {
    var eventCallbacks = this.eventMap_[index];
    _.each(eventCallbacks, function(eventCallback) {
      eventCallback();
    });
  }
};

/** Adds the event at the index to the event stack for the index. */
EventBus.prototype.addToEventStack_ = function(index, callback) {
  // Negative times will just be 0.
  if (index < 0) {
    index = 0;
  }
  
  if (!this.eventMap_.hasOwnProperty(index)) {
    this.eventMap_[index] = [];
  }
  this.eventMap_[index].push(callback);
};


/** The event bus' state. */
var EventBusState = {
  RESET : "RESET",
  PAUSED : "PAUSED",
  PLAYING : "PLAYING"
};


/** A callback wrapper. Supports pre-event callbacks. */
var EventBusCallback = function() {
  this.preEventCallback_ = null;
  this.preEventTimeIndex_ = null;
  this.eventCallback_ = null;
  this.eventTimeIndex_ = null;
};

EventBusCallback.prototype.getEventTimeIndex = function() {
  return this.eventTimeIndex_;
};

EventBusCallback.prototype.getEventCallback = function() {
  return this.eventCallback_;
};

EventBusCallback.prototype.setEvent = function(eventTimeIndex, eventCallback) {
  this.eventTimeIndex_ = eventTimeIndex;
  this.eventCallback_ = eventCallback;
};

EventBusCallback.prototype.getPreEventTimeIndex = function() {
  return this.preEventTimeIndex_;
};

EventBusCallback.prototype.getPreEventCallback = function() {
  return this.preEventCallback_;
};

EventBusCallback.prototype.setPreEvent = function(preEventTimeIndex, preEventCallback) {
  this.preEventTimeIndex_ = preEventTimeIndex;
  this.preEventCallback_ = preEventCallback;
};

EventBusCallback.prototype.hasPreEventCallback = function() {
  return (this.preEventCallback_ != null);
};
