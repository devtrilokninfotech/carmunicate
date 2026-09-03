    // Mobile Mockup Slider Animation Start



    function initVendorStorySlider(opts) {

        var AUTOPLAY_SPEED = opts.autoplaySpeed || 3000;

        var $vendorPhone = $(opts.phoneSelector);
        var $stepsWrap = $(opts.stepsSelector);
        var $steps = $stepsWrap.find('.story-step');

        var totalSlides = $steps.length;

        var vendorInView = false;
        var autoplayTimer = null;
        var currentIndex = 0;
        var isMobileMode = false;

        var mq = window.matchMedia('(max-width: 991px)');

        // Progress state
        var progressStartTime = 0;
        var remainingTime = AUTOPLAY_SPEED;
        var pausedProgress = 0;

        function resetBars() {
            $steps.find('.story-progress').css({
                transition: 'none',
                width: '0%'
            });
        }

        function freezeBars() {
            $steps.find('.story-progress').each(function() {
                var pct = $(this).parent().width() ?
                    ($(this).width() / $(this).parent().width()) * 100 :
                    0;

                $(this).css({
                    transition: 'none',
                    width: pct + '%'
                });
            });
        }

        function startBar(index, duration) {

            duration = duration || AUTOPLAY_SPEED;

            remainingTime = duration;
            progressStartTime = Date.now();

            var $bar = $steps.eq(index).find('.story-progress');

            $bar.css({
                transition: 'none',
                width: '0%'
            });

            $bar[0].offsetHeight;

            requestAnimationFrame(function() {

                $bar.css({
                    transition: 'width ' + duration + 'ms linear',
                    width: '100%'
                });

            });

        }

        function clearAutoplayTimer() {

            if (autoplayTimer) {
                clearTimeout(autoplayTimer);
                autoplayTimer = null;
            }

        }

        function scheduleNext(duration) {

            duration = duration || AUTOPLAY_SPEED;

            clearAutoplayTimer();

            if (!vendorInView) return;

            remainingTime = duration;

            autoplayTimer = setTimeout(function() {

                remainingTime = AUTOPLAY_SPEED;

                goTo((currentIndex + 1) % totalSlides);

            }, duration);

        }

        function pauseStory() {

            if (!vendorInView) return;

            clearAutoplayTimer();

            var elapsed = Date.now() - progressStartTime;

            remainingTime = Math.max(0, remainingTime - elapsed);

            var $bar = $steps.eq(currentIndex).find('.story-progress');

            pausedProgress = $bar.parent().width() ?
                ($bar.width() / $bar.parent().width()) * 100 :
                0;

            $bar.css({
                transition: 'none',
                width: pausedProgress + '%'
            });

        }

        function resumeStory() {

            if (!vendorInView) return;

            var $bar = $steps.eq(currentIndex).find('.story-progress');

            // If no remaining time, restart current slide
            if (remainingTime <= 0) {
                remainingTime = AUTOPLAY_SPEED;
            }

            progressStartTime = Date.now();

            $bar[0].offsetHeight;

            requestAnimationFrame(function() {

                $bar.css({
                    transition: 'width ' + remainingTime + 'ms linear',
                    width: '100%'
                });

            });

            scheduleNext(remainingTime);

        }

        function goTo(index, fromSlick) {

            currentIndex = index;

            $steps.removeClass('active')
                .eq(index)
                .addClass('active');

            $vendorPhone.slick('slickGoTo', index);

            if (isMobileMode && !fromSlick) {
                $stepsWrap.slick('slickGoTo', index);
            }

            resetBars();

            if (vendorInView) {

                remainingTime = AUTOPLAY_SPEED;

                startBar(index, AUTOPLAY_SPEED);

                scheduleNext(AUTOPLAY_SPEED);

            }

        }

        function enableMobileMode() {

            isMobileMode = true;

            $stepsWrap.slick({

                slidesToShow: 1,
                slidesToScroll: 1,
                vertical: false,
                verticalSwiping: false,
                variableWidth: false,
                swipeToSlide: true,
                adaptiveHeight: false,
                arrows: true,
                infinite: true,
                initialSlide: currentIndex

            });

            $stepsWrap.on('afterChange.vendorMobile', function(e, slick, idx) {

                goTo(idx, true);

            });

        }

        function disableMobileMode() {

            isMobileMode = false;

            $stepsWrap.off('afterChange.vendorMobile');

            if ($stepsWrap.hasClass('slick-initialized')) {
                $stepsWrap.slick('unslick');
            }

        }

        function applyMode() {

            clearAutoplayTimer();

            if (mq.matches) {

                disableMobileMode();
                enableMobileMode();

            } else {

                disableMobileMode();

            }

            goTo(currentIndex);

        }

        $steps.on('click', function() {

            if (isMobileMode) return;

            clearAutoplayTimer();

            goTo($steps.index(this));

        });

        $vendorPhone.slick({

            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            infinite: true,
            fade: true,
            adaptiveHeight: false

        });

        resetBars();

        applyMode();

        if (mq.addEventListener) {
            mq.addEventListener('change', applyMode);
        } else {
            mq.addListener(applyMode);
        }

        var sectionEl = opts.sectionSelector ?
            document.querySelector(opts.sectionSelector) :
            $stepsWrap.closest('section')[0];

        if (sectionEl && 'IntersectionObserver' in window) {

            var observer = new IntersectionObserver(function(entries) {

                entries.forEach(function(entry) {

                    // Start when at least 15% of the section is visible
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {

                        if (!vendorInView) {

                            vendorInView = true;

                            // Start/resume autoplay
                            resumeStory();

                        }

                    } else {

                        if (vendorInView) {

                            vendorInView = false;

                            // Pause autoplay
                            pauseStory();

                            // Keep current progress
                            freezeBars();

                        }

                    }

                });

            }, {
                threshold: [0, 0.15, 0.4, 1]
            });

            observer.observe(sectionEl);

        }

        // Pause when browser tab is inactive
        document.addEventListener('visibilitychange', function() {

            if (document.hidden) {

                if (vendorInView) {
                    pauseStory();
                }

            } else {

                if (vendorInView) {
                    resumeStory();
                }

            }

        });


        return {
            restart: function() {

                clearAutoplayTimer();

                currentIndex = 0;
                remainingTime = AUTOPLAY_SPEED;
                pausedProgress = 0;

                vendorInView = true;

                resetBars();

                $steps.removeClass('active').eq(0).addClass('active');

                if ($vendorPhone.hasClass('slick-initialized')) {
                    $vendorPhone.slick('slickGoTo', 0, true);
                    $vendorPhone.slick('setPosition');
                }

                if (isMobileMode && $stepsWrap.hasClass('slick-initialized')) {
                    $stepsWrap.slick('slickGoTo', 0, true);
                    $stepsWrap.slick('setPosition');
                }

                startBar(0, AUTOPLAY_SPEED);
                scheduleNext(AUTOPLAY_SPEED);
            }
        };

    }



    // Slider 1
    var vendorSlider = initVendorStorySlider({
        phoneSelector: '.iphone-screen-slider-v1',
        stepsSelector: '.story-steps-slider-v1',
        sectionSelector: '#vendorsapps',
        autoplaySpeed: 5000
    });

    // Slider 2
    var buyerSlider = initVendorStorySlider({
        phoneSelector: '.iphone-screen-slider',
        stepsSelector: '.story-steps-slider',
        sectionSelector: '#buyers',
        autoplaySpeed: 5000
    });


    $(document).on('click', '.vendorsapps-click', function(e) {

        setTimeout(function() {
            vendorSlider.restart();
        }, 100);

    });

    $(document).on('click', '.buyers-click', function(e) {

        setTimeout(function() {
            buyerSlider.restart();
        }, 100);

    });

    // Mobile Mockup Slider Animation END