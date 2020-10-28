<?php

namespace spicyweb\fieldlabels\migrations;

use Craft;
use craft\db\Migration;
use craft\fieldlayoutelements\CustomField;
use craft\helpers\Db;
use spicyweb\fieldlabels\Plugin as FieldLabels;

/**
 * Transitions Field Labels data to the in-built Craft 3.5 field relabelling format.
 *
 * @package spicyweb\fieldlabels\migrations
 * @author Spicy Web <plugins@spicyweb.com.au>
 * @since 1.3.0
 */
class m200726_085655_craft_3_5_field_layout_transition extends Migration
{
    private $_labels = [];

    /**
     * @inheritdoc
     */
    public function safeUp()
    {
        $fieldsService = Craft::$app->getFields();
        $projectConfig = Craft::$app->getProjectConfig();
        $oldLabels = FieldLabels::$plugin->methods->getAllLabels();
        $layouts = [];
        $fields = [];

        // Re-index the labels by layout/field UIDs, so we can easily look them up when updating the layouts
        foreach ($oldLabels as $label) {
            if (!isset($layouts[$label->fieldLayoutId])) {
                $layout = $fieldsService->getLayoutById($label->fieldLayoutId);

                // skip over labels belonging to deleted layouts
                if (null === $layout) {
                    continue;
                }

                $layouts[$label->fieldLayoutId] = $layout;
            }

            $layoutUid = $layouts[$label->fieldLayoutId]->uid;
            $fieldUid = $fields[$label->fieldId] ?? Db::uidById('{{%fields}}', $label->fieldId);
            $this->_labels[$layoutUid][$fieldUid] = $label;

            if (!isset($fields[$label->fieldId])) {
                $fields[$label->fieldId] = $fieldUid;
            }
        }

        // No need for these anymore
        unset($oldLabels, $fields);

        $hasLabellableTypes = [
            'categoryGroups' => ['fieldLayouts'],
            'commerce.productTypes' => ['productFieldLayouts', 'variantFieldLayouts'],
            'entryTypes' => ['fieldLayouts'],
            'events.eventTypes' => ['eventFieldLayouts'],
            'events.ticketTypes' => ['ticketFieldLayouts'],
            'giftVoucher.voucherTypes' => ['voucherFieldLayouts'],
            'globalSets' => ['fieldLayouts'],
            'neoBlockTypes' => ['fieldLayouts'],
            'tagGroups' => ['fieldLayouts'],
            'volumes' => ['fieldLayouts'],
            'wishlist.listTypes' => ['itemFieldLayouts', 'listFieldLayouts'],
        ];

        $directlyLabellable = [
            'commerce.orders',
            'commerce.subscriptions',
            'giftVoucher.codes',
            'users',
        ];

        foreach ($hasLabellableTypes as $labellable => $layoutTypes) {
            foreach (($projectConfig->get($labellable) ?? []) as $uid => $config) {
                $this->_applyLabelsToProjectConfig($labellable . '.' . $uid, $config, $layoutTypes);
            }
        }

        foreach ($directlyLabellable as $labellable) {
            $this->_applyLabelsToProjectConfig(
                $labellable,
                $projectConfig->get($labellable) ?? [],
                ['fieldLayouts']
            );
        }

        // If we were unable to apply labels to the project config (e.g. plugins that don't support project config), the
        // next best thing we can do is to apply them directly to the DB
        if (count($this->_labels) > 0) {
            Craft::warning(Craft::t('fieldlabels', 'Field Labels saved some converted label data directly to the database that was unable to be saved to the project config.  Please run a project config rebuild before applying your project config to another Craft install.'));

            foreach ($layouts as $layout) {
                $layoutUpdated = false;

                foreach ($layout->getTabs() as $tab) {
                    foreach ($tab->elements as &$tabElement) {
                        // Clearly only fields will have Field Labels data
                        if (!($tabElement instanceof CustomField)) {
                            continue;
                        }

                        $label = $this->_labels[$layout->uid][$tabElement->fieldUid] ?? null;

                        // No label for this layout/field, nothing to do here
                        if ($label === null) {
                            continue;
                        }

                        if (!$layoutUpdated) {
                            $layoutUpdated = true;
                        }

                        $tabElement->label = $label->hideName ? '__blank__' : $label->name;
                        $tabElement->instructions = $label->instructions;
                    }
                }

                // No need to resave the layout if we never updated any elements
                if ($layoutUpdated) {
                    $fieldsService->saveLayout($layout);
                }
            }
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown()
    {
        echo "m200726_085655_craft_3_5_field_layout_transition cannot be reverted.\n";
        return false;
    }

    private function _applyLabelsToProjectConfig($labellable, $labellableConfig, $layoutTypes) {
        $projectConfig = Craft::$app->getProjectConfig();
        $anyLayoutUpdated = false;

        foreach ($layoutTypes as $layoutType) {
            if (!isset($labellableConfig[$layoutType])) {
                continue;
            }

            foreach ($labellableConfig[$layoutType] as $layoutUid => &$layoutConfig) {
                if (!isset($this->_labels[$layoutUid]) || !isset($layoutConfig['tabs'])) {
                    continue;
                }

                foreach ($layoutConfig['tabs'] as &$tab) {
                    if (!isset($tab['elements'])) {
                        continue;
                    }

                    foreach ($tab['elements'] as &$element) {
                        // Clearly only fields will have Field Labels data
                        if (!isset($element['fieldUid'])) {
                            continue;
                        }

                        $label = $this->_labels[$layoutUid][$element['fieldUid']] ?? null;

                        // No label for this layout/field, nothing to do here
                        if ($label === null) {
                            continue;
                        }

                        if (!$anyLayoutUpdated) {
                            $anyLayoutUpdated = true;
                        }

                        $element['label'] = $label->hideName ? '__blank__' : $label->name;
                        $element['instructions'] = $label->instructions;

                        unset($this->_labels[$layoutUid][$element['fieldUid']]);
                    }
                }
            }
        }

        // No need to resave the layout if we never updated any elements
        if ($anyLayoutUpdated) {
            $projectConfig->set($labellable, $labellableConfig);
        }
    }
}
