/* Constants */

const navbarId = 'index-nav';
const navStickyClassName = 'sticky';
const titleId = 'title-card';
const bodyId = 'index-body';
const textFlashId = 'text-flashing';

/* Globals */

var scroll = new SmoothScroll('a[href*="#"]', {
	// Options
});
var hasEntered = false;
var hasLoaded = false;
var keys = {37: 1, 38: 1, 39: 1, 40: 1};
var navBar;
var title;
var pieBody;

/* Helper Functions */
var stickNavbar = function () {
	if (window.scrollY >= title.offsetHeight) {
		navBar.classList.add(navStickyClassName);
	}
	else {
		navBar.classList.remove(navStickyClassName);
	}
	setBodyMargin();
}

var setBodyMargin = function () {
	pieBody.style.paddingTop = navBar.classList.contains(navStickyClassName) ?
		navBar.clientHeight.toString() + 'px' : '0px';
	document.scrollTop -= navBar.clientHeight;
}

/* Event Handling */

window.addEventListener('load', function() {
	title = document.getElementById(titleId);
	navBar = document.getElementById(navbarId);
	pieBody = document.getElementById(bodyId);
	// flashText();
	hasLoaded = true;
	// disableScroll();
});

window.addEventListener('scroll', function() {
	stickNavbar();
});

window.addEventListener('resize', function() {
	if (!hasLoaded) return;
	setBodyMargin();
})

/* Header Scrolling */

$(window).on('beforeunload', function() {
	$(window).scrollTop(0);
});

$(".scroll").on('click', function() {
	var pieNavHeight = $("#index-nav").height();
	var scrollToId = $(this).attr("id").split("-")[1];
  	$('html,body').animate({ scrollTop: $("#" + scrollToId).offset().top - pieNavHeight},'slow');
});

$(window).scroll(function (event) {
	var scroll = $(window).scrollLeft();
	var nav = $('#index-nav');
	if (nav.hasClass('sticky')) {
		nav.css('margin-left',-scroll);
	}
	else {
		nav.css('margin-left', 0);
	}
});

/* Key Handling */

var onKeyDown = function(ev)
{
	// switch (ev.keyCode)
	// {
	// }
}