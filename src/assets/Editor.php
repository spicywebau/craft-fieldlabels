<?php
namespace spicyweb\fieldlabels\assets;

use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

/**
 * Class Editor
 *
 * @package spicyweb\fieldlabels\assets
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class Editor extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public function init() {
        $this->sourcePath = '@spicyweb/fieldlabels/resources/js';
        $this->depends = [ CpAsset::class ];
        $this->js = ['Editor.js', 'EditorModal.js'];

        parent::init();
    }
}
