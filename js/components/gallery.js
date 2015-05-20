/**
 * Define the gallery application
 */
var Gallery = function(options) {
    var storedImages = localStorage.getItem('images');

    // Create the images map
    this.images = (storedImages) ? JSON.parse(storedImages) : {};


    // Set the instagram properties
    this.clientId = '1bffbc3716944f58ba95ea36818d8ef2';
    this.tag = 'surfing';
    this.container = 1;
    this.gallery = 1;
    this.promoCounter = 0;

    // Set the base URL
    this.baseURL = 'https://api.instagram.com/v1/tags/' + this.tag + '/media/recent?client_id=' + this.clientId + '&callback=?';

    // Load gallery images
    this.loadGalleryImages();
};
/**
 * 
 */
Gallery.prototype.renderGallery = function() {
    // Point to the gallery instance
    var _this = this;

    // Get the old container id
    var oldContainerId = '#gallery' + _this.gallery;

    // Loop through images keys
    var keys = _.keys(_this.images).sort().reverse();

    if (keys.length !== $(oldContainerId).find('li').length) {

        // Render the gallery
        var galleryImageList = $('<ul class="list-unstyled images"></ul>');

        // Render image element
        var image = null;
        keys.forEach(function(key, index) {
            image = _this.images[key];

            galleryImageList.append('<li id="' + key + '"><img class="img-responsive" src="' + image.images.standard_resolution.url + '"/></li>')
        });

        // Toggle containers
        _this.gallery = (_this.gallery === 1) ? 2 : 1;

        // Get the new container id
        var newContainerId = '#gallery' + _this.gallery;

        // Add images to gallery
        $(newContainerId).html(galleryImageList);

        $(oldContainerId).toggleClass("hidden-container");
        $(newContainerId).toggleClass("hidden-container");
    }
};

/**
 * 
 */
Gallery.prototype.appendGalleryImages = function(images) {
    // Point to the gallery instance
    var _this = this;

    // Loop through the images object and add the images to out hashmap
    images.forEach(function(image) {
        var imageId = image.id.replace('_' + image.user.id, '');

        if (!_this.images[imageId]) _this.images[imageId] = image;
    });

    localStorage.setItem('images', JSON.stringify(_this.images));
};

Gallery.prototype.getNextMainImageId = function() {
    // Point to the gallery instance
    var _this = this;

    // Create images array
    var images = _.values(_this.images);

    // Sort the array by the times an images was shown
    images.sort(function(firstImage, secondImage) {
        return (firstImage.shown || 0) - (secondImage.shown || 0);
    });

    if (_this.offline) {
        images.filter(function(image) {
            return (image.shown && image.shown > 0);
        })
    }

    // Get the best image to show
    var imageToShow = images[0];

    // Set the image shown counter
    var imageId = imageToShow.id.replace('_' + imageToShow.user.id, '');
    _this.images[imageId].shown = _this.images[imageId].shown ? _this.images[imageId].shown + 1 : 1;
    localStorage.setItem('images', JSON.stringify(_this.images));

    return imageId;
};

/**
 * 
 */
Gallery.prototype.showPromo = function() {
    // Point to the gallery instance
    var _this = this;

    _this.promoCounter++;

    // Get the old container id
    var oldContainerId = '#main-image-container' + _this.container;

    // Toggle containers
    _this.container = (_this.container === 1) ? 2 : 1;

    // Get the new container id
    var newContainerId = '#main-image-container' + _this.container;

    // Set the image elements
    $('#user-name' + _this.container).hide();
    $(newContainerId + ' .image-text-container').hide();
    $('#user-image' + _this.container).hide();

    $('#main-image' + _this.container).attr('src', 'img/promo.png');

    // Toggle containers
    $('#main-image' + _this.container).load(function() {
        $(oldContainerId).toggleClass("hidden-container");
        $(newContainerId).toggleClass("hidden-container");

        $('#main-image' + _this.container).unbind("load");
        $('#main-image' + ((_this.container === 1) ? 2 : 1)).unbind("load");

        _this.promoCounter = 0;
    });
};

/**
 * 
 */
Gallery.prototype.setMainImage = function() {
    // Point to the gallery instance
    var _this = this;

    _this.promoCounter++;

    // Find first image
    var image = _this.images[_this.getNextMainImageId()];

    // Get the old container id
    var oldContainerId = '#main-image-container' + _this.container;

    // Toggle containers
    _this.container = (_this.container === 1) ? 2 : 1;

    // Get the new container id
    var newContainerId = '#main-image-container' + _this.container;

    if (image.local) {
        // Set the image elements
        $('#user-name' + _this.container).hide();
        $(newContainerId + ' .image-text-container').hide();
        $('#user-image' + _this.container).hide();
    } else {
        // Set the image elements
        $('#user-name' + _this.container).show();
        $('#user-name' + _this.container).html(image.user.full_name || image.user.username);

        $(newContainerId + ' .image-text-container').show();
        $('#image-text' + _this.container).html(image.caption.text);

        $('#user-image' + _this.container).show();
        $('#user-image' + _this.container).attr('src', image.user.profile_picture);
    }

    $('#main-image' + _this.container).attr('src', image.images.standard_resolution.url);

    // Toggle containers
    $('#main-image' + _this.container).load(function() {
        $(oldContainerId).toggleClass("hidden-container");
        $(newContainerId).toggleClass("hidden-container");

        $('#main-image' + _this.container).unbind("load");
        $('#main-image' + ((_this.container === 1) ? 2 : 1)).unbind("load");
    });
};

/**
 * 
 */
Gallery.prototype.updateGallery = function() {
    // Point to the gallery instance
    var _this = this;

    // Update the gallery
    if (!_this.counter) {
        _this.timeout = window.setTimeout(function() {
            _this.loadNewImages();

            // Replace image
            if (_this.promoCounter < 10) {
                _this.setMainImage();
            } else {
                _this.showPromo();
            }
        }, 5000);
    }
};

/**
 * 
 */
Gallery.prototype.loadNewImages = function() {
    // Point to the gallery instance
    var _this = this;

    // Find last image
    var lastImageId = _.findLastKey(_this.images);

    // Create the API URL
    var url = (lastImageId) ? this.baseURL + '&min_tag_id=' + lastImageId : this.baseURL;

    // Get new images
    $.ajax({
        url: url,
        dataType: "jsonp",
        timeout: 5000,
        success: function(response) {
            _this.offline = false;

            _this.appendGalleryImages(response.data);

            // Render gallery
            _this.renderGallery();

            // Replace image
            _this.updateGallery();
        },
        error: function() {
            _this.offline = true;

            // Replace image
            _this.updateGallery();
        }
    });
};

/**
 * 
 */
Gallery.prototype.loadGalleryImages = function(url) {
    // Point to the gallery instance
    var _this = this;

    var url = (url) ? url + '&callback=?' : this.baseURL;

    // Get new images
    $.getJSON('data/local-images.json', function(response) {
        _this.appendGalleryImages(response.data);

        // Get new images
        $.getJSON(url, function(response) {
            _this.offline = false;

            _this.appendGalleryImages(response.data);

            // Continue loading more images
            if (response.pagination.next_url && _.keys(_this.images).length < 100) _this.loadGalleryImages(response.pagination.next_url);
            // Or start the gallery
            else {
                // Render gallery
                _this.renderGallery();

                // Replace image
                _this.updateGallery();
            }
        });
    });
};