<?php
namespace spicyweb\fieldlabels;

use Craft;
use craft\elements\Asset;
use craft\elements\Category;
use craft\elements\Entry;
use craft\elements\Tag;
use craft\helpers\Json as JsonHelper;
use craft\web\Controller as BaseController;

/**
 * Class Controller
 *
 * @package spicyweb\fieldlabels
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class Controller extends BaseController
{
    public function actionGetEditorHtml()
    {
        $elementsService = Craft::$app->getElements();
        $requestService = Craft::$app->getRequest();
        $element = null;

        $elementId = $requestService->getBodyParam('elementId');
        $elementType = $requestService->getBodyParam('elementType');
        $includeSites = $requestService->getBodyParam('includeSites', false);

        if ($elementId !== null) {
            if ($elementType === null) {
                $elementType = $elementsService->getElementTypeById($elementId);
            }

            $element = $elementsService->getElementById($elementId, $elementType);
        }

        // Get Craft's element editor data so we can send it back with extra data that Field Labels needs
        $response = Craft::$app->runAction(
            'elements/get-editor-html',
            [
                'includeSites' => $includeSites,
            ]
        );

        if ($element !== null) {
            $data = $response->data;

            switch ($elementType) {
                case Asset::class:
                    $data['elementType'] = 'asset';
                    $data['volumeId'] = $element->volumeId;
                    break;

                case Category::class:
                    $data['elementType'] = 'category';
                    $data['categoryGroupId'] = $element->groupId;
                    break;

                case Entry::class:
                    $data['elementType'] = 'entry';
                    $data['sectionId'] = $element->sectionId;
                    $data['entryTypeId'] = $element->typeId;
                    break;

                case Tag::class:
                    $data['elementType'] = 'tag';
                    $data['tagGroupId'] = $element->groupId;
                    break;
            }

            return $this->asJson($data);
        }

        return $response;
    }
}
