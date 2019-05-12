<?php
namespace spicyweb\fieldlabels;

use yii\base\Event;

use Craft;
use craft\base\Plugin as BasePlugin;
use craft\db\Query;
use craft\db\Table;
use craft\elements\User;
use craft\events\RebuildConfigEvent;
use craft\events\RegisterUrlRulesEvent;
use craft\helpers\StringHelper;
use craft\models\EntryType;
use craft\services\Fields;
use craft\services\ProjectConfig;
use craft\web\UrlManager;

use spicyweb\fieldlabels\assets\Editor as EditorAsset;
use spicyweb\fieldlabels\assets\Main as MainAsset;
use spicyweb\fieldlabels\assets\Widgets as WidgetsAsset;
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
	public $schemaVersion = '1.1.0';

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

        Event::on(
            UrlManager::class,
            UrlManager::EVENT_REGISTER_CP_URL_RULES,
            function (RegisterUrlRulesEvent $event) {
                $this->_includeResources();
            }
        );

        $projectConfigService = Craft::$app->getProjectConfig();
        $request = Craft::$app->getRequest();

        // Don't try to bind to the layout save event if this is a console request or a project.yaml sync
        if (!($projectConfigService->getIsApplyingYamlChanges() || $request->getIsConsoleRequest())) {
            $this->_bindEvent();
        }

        // Setup project config functionality
        $this->_setupProjectConfig();
    }

    private function _includeResources()
    {
        $requestService = Craft::$app->getRequest();
        $viewService = Craft::$app->getView();
        $userSession = Craft::$app->getUser();

        // Make sure these are not output to the login page code
        if ($requestService->getIsCpRequest() && !$requestService->getIsAjax() && !$userSession->getIsGuest()) {
            $viewService->registerAssetBundle(MainAsset::class);
            $viewService->registerAssetBundle(WidgetsAsset::class);

            if ($userSession->getIsAdmin()) {
                $viewService->registerAssetBundle(EditorAsset::class);
            }

            // Don't try to set these if Field Labels is installing and the table doesn't exist yet
            if (Craft::$app->getDb()->getSchema()->getTableSchema('{{%fieldlabels}}')) {
                $viewService->registerJs('FieldLabels.fields=' . json_encode($this->_getFields()), $viewService::POS_END);
                $viewService->registerJs('FieldLabels.labels=' . json_encode($this->_getLabels()), $viewService::POS_END);
                $viewService->registerJs('FieldLabels.layouts=' . json_encode($this->_getLayouts()), $viewService::POS_END);
                $viewService->registerJs('FieldLabels.setup()', $viewService::POS_END);
                $viewService->registerJs('FieldLabels.Widgets.setup()', $viewService::POS_END);
            }
        }
    }

    private function _bindEvent()
    {
        Event::on(Fields::class, Fields::EVENT_AFTER_SAVE_FIELD_LAYOUT, function(Event $event) {
            $request = Craft::$app->getRequest();
            $layout = $event->layout;
            $layoutFieldIds = Craft::$app->getFields()->getFieldIdsByLayoutId($layout->id);
            $fieldLabels = $request->getBodyParam('fieldlabels');

            if (!$fieldLabels) {
                // Commerce
                $commerceFieldLabels = $request->getBodyParam('fieldlabels-commerce');

                if ($commerceFieldLabels && isset($commerceFieldLabels[$layout->id])) {
                    $fieldLabels = $commerceFieldLabels[$layout->id];
                }
            }

            if ($fieldLabels) {
                $this->methods->saveLabels($fieldLabels, $layout->id);

                $labelledFieldIds = array_keys($fieldLabels);
                $unlabelledFieldIds = array_filter($layoutFieldIds, function($fieldId) use($labelledFieldIds)
                {
                    return !in_array($fieldId, $labelledFieldIds);
                });

                foreach ($unlabelledFieldIds as $fieldId) {
                    if (($label = $this->methods->getLabel($layout->id, $fieldId)) !== null) {
                        $this->methods->deleteLabel($label);
                    }
                }
            }

            // Make sure these labels don't get saved more than once
            unset($_POST['fieldlabels']);
            unset($_POST['fieldlabels-commerce[' . $layout->id . ']']);
        });
    }

    private function _setupProjectConfig()
    {
        // Listen for Field Labels updates in the project config to apply them to the database
        Craft::$app->getProjectConfig()
            ->onAdd('fieldlabels.{uid}', [$this->methods, 'handleChangedLabel'])
            ->onUpdate('fieldlabels.{uid}', [$this->methods, 'handleChangedLabel'])
            ->onRemove('fieldlabels.{uid}', [$this->methods, 'handleDeletedLabel']);

        // Listen for a project config rebuild, and provide the Field Labels data from the database
        Event::on(ProjectConfig::class, ProjectConfig::EVENT_REBUILD, function(RebuildConfigEvent $event) {
            $data = [];
            $query = (new Query)
                ->select([
                    'fl.name',
                    'fl.instructions',
                    'fl.uid',
                    'fields.uid AS field',
                    'layouts.uid AS fieldLayout'
                ])
                ->from('{{%fieldlabels}} fl')
                ->innerJoin('{{%fields}} fields', '[[fl.fieldId]] = [[fields.id]]')
                ->innerJoin('{{%fieldlayouts}} layouts', '[[fl.fieldLayoutId]] = [[layouts.id]]');

            foreach ($query->all() as $label) {
                $data[$label['uid']] = [
                    'field' => $label['field'],
                    'fieldLayout' => $label['fieldLayout'],
                    'name' => $label['name'],
                    'instructions' => $label['instructions'],
                ];
            }

            $event->config['fieldlabels'] = $data;
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
        $pluginsService = Craft::$app->getPlugins();
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
            $entryType = $section->getEntryTypes();

            if (count($entryType) > 0) {
                $singleSections[$section->id] = (int)$entryType[0]->fieldLayoutId;
            }
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

        // Plugin support
        foreach (['commerce', 'calendar'] as $pluginHandle) {
            if ($pluginsService->isPluginInstalled($pluginHandle) && $pluginsService->isPluginEnabled($pluginHandle)) {
                $method = '_get' . StringHelper::toCamelCase($pluginHandle) . 'Layouts';
                $layouts = array_merge($layouts, $this->$method());
            }
        }

        return $layouts;
    }

    private function _getCommerceLayouts(): array
    {
        $fieldsService = Craft::$app->getFields();
        $commercePlugin = Craft::$app->getPlugins()->getPlugin('commerce');
        $productTypes = $commercePlugin->getProductTypes()->getAllProductTypes();
        $layouts = [];

        // Products, variants
        $layouts['commerceProductType'] = $this->_mapCommerceLayouts($productTypes);

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

        return $layouts;
    }

    private function _getCalendarLayouts(): array
    {
        $calendarPlugin = Craft::$app->getPlugins()->getPlugin('calendar');
        $calendars = $calendarPlugin->calendars->getAllCalendars();
        $layouts = [
            'calendar' => $this->_mapLayouts($calendars),
        ];

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
