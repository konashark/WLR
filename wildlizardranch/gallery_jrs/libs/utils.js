UTILS = (function() {
    /**
     * @overview totalWidth and totalHeight are the dimensions of the
     *           browser window.
     *
     * @copyright Stephen Chapman, 3rd Jan 2005, 8th Dec 2005. You may copy
     * these functions but please keep the copyright notice as well.
     */
    var totalWidth = (window.innerWidth !== null) ?
                         window.innerWidth :
                             ((document.documentElement &&
                               document.documentElement.clientWidth) ?
                                   document.documentElement.clientWidth :
                                   ((document.body !== null) ?
                                        document.body.clientWidth : null));
    var totalHeight = (window.innerHeight !== null) ?
                          window.innerHeight :
                              ((document.documentElement &&
                                document.documentElement.clientHeight) ?
                                  document.documentElement.clientHeight :
                                  ((document.body !== null) ?
                                       document.body.clientHeight : null));

    return {
        /* Module Interface */

        /**
         * The screen width in pixels that the browser is currently
         * displaying
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @type {number}
         */
        browserWidth: totalWidth,

        /**
         * The screen height in pixels that the browser is currently
         * displaying
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @type {number}
         */
        browserHeight: totalHeight,

        /**
         * Converts a percentage of the browser width into an actual number
         * of pixels
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {number} perc The percentage of the browser width to convert
         * @return {number} The given percentage in pixels
         */
        percXToPx: function(perc) {
            return Math.floor((totalWidth * perc) / 100);
        },

        /**
         * Converts a percentage of the browser height into an actual number
         * of pixels
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {number} perc The percentage of the browser width to convert
         * @return {number} The given percentage in pixels
         */
        percYToPx: function(perc) {
            return Math.floor((totalHeight * perc) / 100);
        },

        /**
         * Creates an element in the document with a div id
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {string} element The type of element to be created
         * @param {string} parentDiv The parent div to place the new element in
         * @param {string} _id The id of the new element
         * @param {string} _class The class of the new element
         * @return {object} The created element
         */
        createElementFromId: function(element, parentDiv, _id, _class) {
            var parentElement;

            var newElement = document.createElement(element);
            if (_id) {
                newElement.id = _id;
            }
            if (_class) {
                newElement.className = _class;
            }

            try {
                if(parentDiv) {
                    if (typeof parentDiv === "string") {
                        parentElement = document.getElementById(parentDiv);
                        //Checking if parentElement is null or undefined.
                        if (!parentElement) {
                            throw new Error("Parent element undefined");
                        }
                        parentElement.appendChild(newElement);
                    }
                    else if((typeof parentDiv === "object") &&
                        ('appendChild' in parentDiv)) {
                        parentDiv.appendChild(newElement);
                    }
                    else {
                        throw new Error("Parent element type invalid");
                    }
                }
                else {
                    throw new Error("Parent element undefined");
                }
            }
            catch (e) {
                console.error(e);
            }

            return newElement;
        },

        /**
         * Creates an element in the document using a passed in div as a
         * parent for the new element
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {string} element The type of element to be created
         * @param {object} divRef A reference to a div to use
         * @param {string} _id The id of the new element
         * @param {string} _class The class of the new element
         * @return {object} The created element
         */
        createElementFromDivRef: function(element, divRef, _id, _class) {
            var newElement = document.createElement(element);

            if (_id) {
                newElement.id = _id;
            }
            if (_class) {
                newElement.className = _class;
            }
            divRef.appendChild(newElement);

            return newElement;
        },

        /**
         * Removes an element in the document
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {string} element The element to remove. Can also be an element ID.
         */
        removeElement: function(element) {
            var childElement = null;

            if (typeof element === "string") {
                childElement = document.getElementById(element);
            } else if ((typeof element === "object") &&
                ('parentNode' in element) && (element.parentNode !== undefined)) {
                childElement = element;
            }

            if (childElement){
                childElement.parentNode.removeChild(childElement);
            }
        },

        /**
         * Creates an <img> element in the document using a passed in div as a
         * parent for the new element. Sets up onload and onerror event listeners
         * to set/clear loading/error CSS classes and fire the passed in
         * callbacks as appropriate
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} divRef A reference to a div to use
         * @param {string} _id The id of the new element
         * @param {string} _class The class of the new element
         * @param {function} loadCallback A callback to fire when the
         *        image is loaded
         * @param {function} errorCallback A callback to fire when
         *        loading fails (e.g. a 404)
         * @return {object} The created <img> element
         */
        createImgElement: function(divRef, _id, _class, loadCallback, errorCallback) {
            var img = document.createElement("img");

            if (_id) {
                img.id = _id;
            }
            if (_class) {
                img.className = _class;
            }

            // Initialise to "loading" state because src hasn't been set yet
            img.classList.add("loading");

            // Setup the event listeners
            img.addEventListener("load", function() {
                this.classList.remove("loading");
                this.classList.remove("error");
                if (loadCallback) {
                    loadCallback.apply(this);
                }
            });

            img.addEventListener("error", function() {
                // Avoid marking it as errored if the src was set to ""
                if (this.src !== this.baseURI) {
                    this.classList.remove("loading");
                    this.classList.add("error");
                    if (errorCallback) {
                        errorCallback.apply(this);
                    }
                }
            });

            divRef.appendChild(img);
            return img;
        },

        /**
         * Loads an image into an existing <img> element and sets the imageLoading
         * CSS class if the src has changed
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} img The <img> element into which to load the
         *        image
         * @param {string} src The URL of the image to load
         */
        loadImage: function(img, src) {
            // We only want to set it as loading if the URL has actually changed.
            // The old value is an absolute URL, whereas the new value may be a
            // relative URL, so use an <a> element to resolve it to an absolute URL
            var absoluteSrc;
            var a = document.createElement("a");
            a.href = src;
            absoluteSrc = a.href;

            if (img.src !== absoluteSrc) {
                img.classList.remove("error");
                img.classList.add("loading");
                img.src = src;
            }
        },

        /**
         * Removes all the child nodes of a parent node
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} node The parent node looking to commit
         *        infanticide
         */
        removeAllChildren: function (node) {
            while (node.hasChildNodes()) {
                node.removeChild(node.lastChild);
            }
        },

        /**
         * Returns the value of the supplied child node's nodeValue or
         * an empty string if neither node or nodeValue are valid
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} node Node to get the nodeValue of
         */
        getChildNodeValue: function(node) {
            if(node) {
                return node.nodeValue ? node.nodeValue : "";
            }
            else {
                return "";
            }
        },

        /**
         * Retrieve an array of nodes matching the selector
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} root The root node to search within
         * @param {string} selector The CSS selector to use to search
         * @return {object[]} The matching nodes
         */
        getNodes: function(root, selector) {
            return root.querySelectorAll(selector);
        },

        /**
         * Retrieve the text value from the first node matching the
         * selector
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} root The root node to search within
         * @param {string} selector The CSS selector to use to search
         * @return {string} The value of the first matching node
         */
        getNodeValue: function(root, selector) {
            var node;
            var value;
            if (root && selector) {
                node = root.querySelector(selector);
                if (node && node.firstChild) {
                    value = node.firstChild.nodeValue;
                }
            }
            return value;
        },

        /**
         * Retrieve an array of text values from the nodes matching the
         * selector
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} root The root node to search within
         * @param {string} selector The CSS selector to use to search
         * @return {string[]} The values of the matching nodes
         */
        getNodeValues: function(root, selector) {
            var nodes, i;
            var values = [];
            if (root && selector) {
                nodes = root.querySelectorAll(selector);
                for (i = 0; i < nodes.length; i++) {
                    if (nodes[i] && nodes[i].firstChild) {
                        values.push(nodes[i].firstChild.nodeValue);
                    }
                }
            }
            return values;
        },

        /**
         * This method allows to get measurements so that an image will fit a
         * destination box while preserving the image's ratio. So, method
         * returns width and height so that, if the image takes this size, it
         * will fit inside destinationWidth and destinationHeight, while keeping
         * its original ratio.
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} imageWidth native width of the image
         * @param {object} imageHeight native height of the image
         * @param {object} destinationWidth prefered size for the image
         *        on the page
         * @param {object} destinationHeight prefered size for the image
         *        on the page
         * @return {object} An object containing the ideal width and
         *         height for the image
         */
        preserveRatio: function(imageWidth, imageHeight, destinationWidth, destinationHeight) {
            var imageRatio = imageWidth / imageHeight;
            var result = { width: destinationWidth, height: destinationHeight};
            // We imagine that we will set the height of the image to the
            // destination height, and check if the width of the image, when the
            // ratio is kept, is in bound
            var potentialResultWidth = destinationHeight * imageRatio;
            // Width is not in bound: final width will be destination width, and
            // we set the height accordingly
            if (potentialResultWidth > destinationWidth) {
                result.height = destinationWidth / imageRatio;
            // Width is in bound: final height will be destination height, we
            // set the width accordingly
            } else if (potentialResultWidth < destinationWidth) {
                result.width = potentialResultWidth;
            }
            return result;
        },

        /**
         * This function will fit an image to a space (window) scaling as
         * appropriate based on the relative aspect ratios of the space and
         * image and sizes whilst retaining the aspect ratio of the image.
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} imgElement the targetted <img>
         */
        fitToSpace: function(imgElement) {
            // aspect ratios
            var windowAR = imgElement.width / imgElement.height;
            var imageAR = imgElement.naturalWidth / imgElement.naturalHeight;
            var scaleFactor;

            if (windowAR - imageAR > 0) {
                // all available width - scale height
                scaleFactor = imgElement.width / imgElement.naturalWidth;
                imgElement.height = imgElement.naturalHeight * scaleFactor;
            }
            else {
                // all available height scale width
                scaleFactor = imgElement.height / imgElement.naturalHeight;
                imgElement.width = imgElement.naturalWidth * scaleFactor;
            }
        },
        /**
         * Allows to set relative width and height (i.e values in %) to an image,
         * preserving its aspect ratio. Goal of this function is to make the size
         * of the image as close as possible to the given values, while still
         * preserving the image's original ratio.
         *
         * @public
         * @memberof JUNOTK.SCREENUTILS
         * @param {object} imgElement the targetted <img>
         * @param {object} parentElement the parent element of the image
         * @param {object} optimalWidthPercentage the wanted width's
         *        percentage
         * @param {object} optimalHeightPercentage the wanted height's
         *        percentage
         */
        applyRatioToImage: function(imgElement, parentElement, optimalWidthPercentage,
            optimalHeightPercentage) {

            var targetWidth = parentElement.offsetWidth * optimalWidthPercentage / 100;
            var targetHeight = parentElement.offsetHeight * optimalHeightPercentage / 100;
            var idealSize = JUNOTK.SCREENUTILS.preserveRatio(imgElement.naturalWidth,
                imgElement.naturalHeight, targetWidth, targetHeight);
            idealSize.width = idealSize.width * 100 / parentElement.offsetWidth;
            idealSize.height = idealSize.height * 100 / parentElement.offsetHeight;
            imgElement.style.width = idealSize.width + '%';
            imgElement.style.height = idealSize.height + '%';
        }
    };
})();
