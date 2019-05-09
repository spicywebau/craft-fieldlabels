<?php
namespace spicyweb\fieldlabels\assets;

use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

/**
 * Class Widgets
 *
 * @package spicyweb\fieldlabels\assets
 * @author Spicy Web <craft@spicyweb.com.au>
 * @since 1.1.0
 */
class Widgets extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public function init() {
        $this->sourcePath = '@spicyweb/fieldlabels/resources';
        $this->depends = [ CpAsset::class ];
        $this->js = ['js/Widgets.js'];

        parent::init();
    }
}
