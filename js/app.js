var placesData = [ //an array of objects
    {
      name: 'Dry Town Water Park', 
      location: {lat: 34.557472, 
        lng:-118.059380}
    },
    { 
      name: 'Domenic Massari Park', 
      location: {lat:34.568944, 
        lng: -118.031710}
    },
    { 
      name: 'Mulligan Family Fun Center', 
      location: {lat:34.599137, 
        lng: -118.142013}
    },
    { 
      name: 'Joe Davies Heritage Airpark', 
      location: {lat: 34.602919,  
        lng: -118.088693}
    },
    { 
      name: 'Palmdale Fin & Feather Club', 
      location: {lat:34.552781, 
        lng: -118.127840}
    },
    {
      name: 'Brunswick Zone Vista Lanes',
      location: {lat: 34.577692, 
        lng: -118.078364}
    }, 
    {
      name: 'Palmdale Playhouse', 
      location: {lat: 34.578149, 
        lng: -118.111528}
    }, 
    {
      name: 'Palmdale Oasis Park Rec Center', 
      location: {lat:34.557053,
        lng:-118.061631}
    }, 
    {
      name: 'Hammack Activity Center',
      location: {lat: 34.582328, 
        lng:-118.114847}
    },
    {
      name: 'Madeline Court Recreation Center', 
      location: {lat:34.575309,
        lng: -118.007299}
    }
];

var palmdale_coord = {lat: 34.5794, lng: -118.1165};

var foursquare_creds = {
  ID: 'DYRYQIHSBPCQ530BVNEWBPCJC3YEVNH4RF4ZODHESBVOKM4G', 
  SECRET: 'CHV2CUK3VKMJM5VXMPKJDUJ5FU5ER2YVCDMEPQEDINSHNRYY'
};

var WU_KEY = '8ba14807be59fb14';
var W_URL = "http://api.wunderground.com/api/"+ WU_KEY +"/conditions/q/" +
              palmdale_coord.lat +","+palmdale_coord.lng + ".json";


function ViewModel() {

  var self=this;

  self.mapMessage = ko.observable('');

  // Create a new Google Map
  self.googleMap = new google.maps.Map(document.getElementById('map'), {
    center: palmdale_coord,
    zoom: 15
  });

  var bounds = new google.maps.LatLngBounds();
  self.pickedPlace = ko.observable();
  self.userInput = ko.observable('');

  self.weatherTemp = ko.observable('');
  self.weatherFaren = ko.observable(true);
  
  // infowindow
  var infoWindow = new google.maps.InfoWindow();
  infoWindow.addListener('closeclick', function() {  
    self.pickedPlace('');
  });  


  self.allPlaces = [];

  placesData.forEach(function(placeObj) {
    self.allPlaces.push(new Place(placeObj));
  });

  // Create a marker for each of the places in the allPlaces array
  self.allPlaces.forEach(function(place) {
    var markerOptions = {
      map: self.googleMap,
      position: place.location,
      animation: null
    };
    
    bounds.extend(place.location);
    self.googleMap.fitBounds(bounds);
    place.marker = new google.maps.Marker(markerOptions);

    place.marker.addListener('click', function(){
      self.loadWindow(place)});
  });


  // LIST FILTER 

  self.visiblePlaces = ko.observableArray();
  self.allPlaces.forEach(function(place) {
    self.visiblePlaces.push(place);
  });


  self.filterLocations = function() {
    var searchInput = self.userInput().toLowerCase();
    
    self.visiblePlaces.removeAll();
    self.pickedPlace('');
    infoWindow.close();
    bounds = new google.maps.LatLngBounds();

    // This looks at the name of each places and then determines if the user
    // input can be found within the place name.
    self.allPlaces.forEach(function(place) {
      place.marker.setVisible(false);
      
      if (place.name.toLowerCase().indexOf(searchInput) !== -1) {
        self.visiblePlaces.push(place);
      }
    });
    
    self.visiblePlaces().forEach(function(place) {
      place.marker.setVisible(true);
      bounds.extend(place.location);
    });

    self.reZoomMap(bounds);
  };


  self.showAllPlaces = function(){
    self.visiblePlaces.removeAll();
    self.allPlaces.forEach(function(place) {
      place.marker.setVisible(true);
      bounds.extend(place.location);
      self.visiblePlaces.push(place);
    });
    self.reZoomMap(bounds);
    self.pickedPlace('');  
    self.userInput('');
    infoWindow.close();
  };

  
  self.reZoomMap = function(bounds) {
    self.googleMap.fitBounds(bounds);
    if (self.googleMap.getZoom() > 17){
      self.googleMap.setZoom(17);
    }
    if (self.visiblePlaces.length === 0){
      self.googleMap.setCenter({lat: 34.5794, lng: -118.1165});
      self.googleMap.setZoom(16);
    }
    else{
    self.googleMap.panToBounds(bounds); }
  };


  self.isSelected = function(place) {
        return self.pickedPlace() === place;
  };


  // INFOWINDOWS

  self.loadWindow = function(place) {
    toggleBounce(place.marker);
    self.pickedPlace(place);
    //infoWindow.setContent(windowContent(place));
    windowContent(place);
  };

  function windowContent(place){
    var url = 'https://api.foursquare.com/v2/venues/search?ll='+ place.location.lat +',' + place.location.lng + '&client_id=' + foursquare_creds.ID + '&client_secret=' + foursquare_creds.SECRET + '&v=20170101';
    var contentString = '<div>' + '<b>' + place.name + '</b>' + '</div>';
    var fsIcon = '';

    //and url

    $.getJSON(url, function(data){
      console.log(data.response.venues[0].name);
      //foursqID = data.response.venues[0].id;
      if (data.response.venues[0].categories[0].name !== undefined){
        fsIconUrl = data.response.venues[0].categories[0].icon.prefix + 'bg_32' + 
                    data.response.venues[0].categories[0].icon.suffix;
        contentString += '<div class="category">'+ 
                          '<img class ="fsIcon" src='+ fsIconUrl +'>' +
                          data.response.venues[0].categories[0].name + 
                          '</div>';
      }
      if(data.response.venues[0].contact.phone !==undefined){
        contentString += '<div> Phone number: '+ data.response.venues[0].contact.formattedPhone + '</div>';
      }

      contentString += '<div class="credit">Information provided by Foursquare</div>';
      infoWindow.setContent(contentString);
      infoWindow.open(map, place.marker);
    }).fail(function(err){
      infoWindow.setContent(contentString + '<div class="error"> Failed to access Foursquare</div>');

    });
  }


  function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);
      }, 2100);
    }
  }



  // PLACE OBJECT

  function Place(dataObj) {
    this.name = dataObj.name;
    this.location = dataObj.location;
    this.marker = null;
  }


  self.changeUnits = function(){
    if (self.weatherFaren() === true) {
      $.getJSON(W_URL, function(data){
        self.weatherTemp(data.current_observation.temp_c + "C");
        self.weatherFaren(false);
      }).fail(function(err){
        self.weatherTemp("Cannot access Weather Underground.");
      });
    }else {
      $.getJSON(W_URL, function(data){
        self.weatherTemp(data.current_observation.temp_f + "F");
        self.weatherFaren(true);
      }).fail(function(err){
        self.weatherTemp("Cannot access Weather Underground.");
      });
    }
  }


  $.getJSON(W_URL, function(data){
    console.log(data);
    self.weatherTemp(data.current_observation.temp_f +"F");
    self.weatherFaren(true);
  }).fail(function(err){
    $(".temp").append("Cannot access Weather Underground. ")
  });

}

// callback function from google maps
function ready(){
  ko.applyBindings(new ViewModel());
}

// if googlemaps fails
function googleError(){
  self.mapMessage("Google Maps not loading.");
}

$(document).ready(function () {
  $('[data-toggle="offcanvas"]').click(function () {
    $('.row-offcanvas').toggleClass('active')
  });
});

