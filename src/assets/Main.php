<?php
namespace spicyweb\fieldlabels\assets;

use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

/**
 * Class Main
 *
 * @package spicyweb\fieldlabels\assets
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class Main extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public function init() {
        $this->sourcePath = '@spicyweb/fieldlabels/resources';
        $this->depends = [ CpAsset::class ];
        $this->css = ['css/main.css'];
        $this->js = ['js/FieldLabels.js'];

        parent::init();
    }
}
