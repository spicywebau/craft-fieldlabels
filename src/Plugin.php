<?php
namespace spicyweb\fieldlabels;

use yii\base\Event;

use Craft;
use craft\base\Plugin as BasePlugin;
use craft\db\Query;
use craft\db\Table;
use craft\elements\User;
use craft\models\EntryType;
use craft\services\Fields;

use spicyweb\fieldlabels\assets\Main as MainAsset;
use spicyweb\fieldlabels\assets\Editor as EditorAsset;
use spicyweb\fieldlabels\models\FieldLabel as FieldLabelModel;

/**
 * Class Plugin
 *
 * @package spicyweb\fieldlabels
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class Plugin extends BasePlugin
{
    /**
     * @var Plugin
     */
    public static $plugin;

	/**
	 * @inheritdoc
	 */
	public $schemaVersion = '1.0.0';

	/**
	 * @var array
	 */
	public $controllerMap = [
		'actions' => Controller::class,
	];

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();

        self::$plugin = $this;

        $this->setComponents([
            'methods' => Service::class,
        ]);

        $this->_includeResources();
        $this->_bindEvent();

		Craft::$app->getProjectConfig()
            ->onAdd('fieldlabels.{uid}', [$this->methods, 'handleChangedLabel'])
            ->onUpdate('fieldlabels.{uid}', [$this->methods, 'handleChangedLabel']);
    }

    private function _includeResources()
    {
        $requestService = Craft::$app->getRequest();
        $viewService = Craft::$app->getView();
        $userSession = Craft::$app->getUser();

        // Make sure these are not output to the login page code
        if ($requestService->getIsCpRequest() && !$requestService->getIsAjax() && !$userSession->getIsGuest()) {
            $viewService->registerAssetBundle(MainAsset::class);

            if ($userSession->getIsAdmin()) {
                $viewService->registerAssetBundle(EditorAsset::class);
            }

            // Don't try to set these if Field Labels is installing and the table doesn't exist yet
            if (Craft::$app->getDb()->getSchema()->getTableSchema('{{%fieldlabels}}')) {
                $viewService->registerJs('FieldLabels.fields=' . json_encode($this->_getFields()), $viewService::POS_END);
                $viewService->registerJs('FieldLabels.labels=' . json_encode($this->_getLabels()), $viewService::POS_END);
                $viewService->registerJs('FieldLabels.layouts=' . json_encode($this->_getLayouts()), $viewService::POS_END);
                $viewService->registerJs('FieldLabels.setup()', $viewService::POS_END);
            }
        }
    }

    private function _bindEvent()
    {
        Event::on(Fields::class, Fields::EVENT_AFTER_SAVE_FIELD_LAYOUT, function(Event $event) {
            $request = Craft::$app->getRequest();
            $layout = $event->layout;
            $fieldLabels = $request->getBodyParam('fieldlabels');

            if ($fieldLabels) {
                $this->methods->saveLabels($fieldLabels, $layout->id);
            }

            // Commerce
            $commerceFieldLabels = $request->getBodyParam('fieldlabels-commerce');

            if ($commerceFieldLabels && isset($commerceFieldLabels[$layout->id])) {
                $this->methods->saveLabels($commerceFieldLabels[$layout->id], $layout->id);
            }

            // Make sure these labels don't get saved more than once
            unset($_POST['fieldlabels']);
            unset($_POST['fieldlabels-commerce[' . $layout->id . ']']);
        });
    }

    private function _getFields(): array
    {
        $fields = Craft::$app->getFields()->getAllFields();
        $output = [];

        foreach ($fields as $field) {
            $output[(int)$field->id] = [
                'id' => (int) $field->id,
                'handle' => $field->handle,
                'name' => $field->name,
                'instructions' => $field->instructions
            ];
        }

        return $output;
    }

    private function _getLabels(): array
    {
        $labels = $this->methods->getAllLabels();
        $output = [];

        foreach ($labels as $label) {
            $output[(int)$label->id] = [
                'id' => (int)$label->id,
                'fieldId' => (int)$label->fieldId,
                'fieldLayoutId' => (int)$label->fieldLayoutId,
                'name' => Craft::t('fieldlabels', $label->name),
                'instructions' => Craft::t('fieldlabels', $label->instructions),
            ];
        }

        return $output;
    }

    private function _getLayouts(): array
    {
        $fieldsService = Craft::$app->getFields();
        $assetVolumes = Craft::$app->getVolumes()->getAllVolumes();
        $categoryGroups = Craft::$app->getCategories()->getAllGroups();
        $globalSets = Craft::$app->getGlobals()->getAllSets();
        $tagGroups = Craft::$app->getTags()->getAllTagGroups();
        $userFields = $fieldsService->getLayoutByType(User::class);

        $entryTypes = [];
        $entryTypeQuery = (new Query())
            ->select([
                'id',
                'sectionId',
                'fieldLayoutId',
                'name',
                'handle',
                'hasTitleField',
                'titleLabel',
                'titleFormat',
                'uid',
            ])
            ->from(Table::ENTRYTYPES)
            ->orderBy(['id' => SORT_DESC]);

        foreach ($entryTypeQuery->all() as $entryType) {
            $entryTypes[] = new EntryType($entryType);
        }

        $sections = Craft::$app->getSections()->getAllSections();
        $singleSections = [];

        foreach ($sections as $section) {
            $entryType = $section->getEntryTypes()[0];
            $singleSections[$section->id] = (int)$entryType->fieldLayoutId;
        }

        $layouts = [
            'assetVolume' => $this->_mapLayouts($assetVolumes),
            'categoryGroup' => $this->_mapLayouts($categoryGroups),
            'globalSet' => $this->_mapLayouts($globalSets),
            'entryType' => $this->_mapLayouts($entryTypes),
            'tagGroup' => $this->_mapLayouts($tagGroups),
            'singleSection' => $singleSections,
        ];

        if ($userFields !== null) {
            $layouts['userFields'] = (int)$userFields->id;
        }

        // Craft Commerce support
        if (class_exists('\craft\commerce\Plugin')) {
            $commerce = \craft\commerce\Plugin::getInstance();

            // Products, variants
            $layouts['commerceProductType'] = $this->_mapCommerceLayouts($commerce->getProductTypes()->getAllProductTypes());

            // Order field layout
            $orderLayout = $fieldsService->getLayoutByType(\craft\commerce\elements\Order::class);

            if ($orderLayout !== null) {
                $layouts['commerceOrderFields'] = (int)$orderLayout->id;
            }

            // Subscription field layout
            $subscriptionLayout = $fieldsService->getLayoutByType(\craft\commerce\elements\Subscription::class);

            if ($subscriptionLayout !== null) {
                $layouts['commerceSubscriptionFields'] = (int)$subscriptionLayout->id;
            }
        }

        return $layouts;
    }

    private function _mapLayouts($list): array
    {
        $output = [];

        foreach ($list as $item) {
            $output[(int)$item->id] = (int)$item->fieldLayoutId;
        }

        return $output;
    }

    private function _mapCommerceLayouts($list): array
    {
        $output = [];

        foreach ($list as $item) {
            $output[(int)$item->id] = [
                'productType' => (int)$item->fieldLayoutId,
                'variant' => (int)$item->variantFieldLayoutId,
            ];
        }

        return $output;
    }
}
