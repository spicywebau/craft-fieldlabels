<?php

namespace spicyweb\fieldlabels\migrations;

use Craft;
use craft\db\Migration;
use craft\fieldlayoutelements\CustomField;
use craft\helpers\Db;
use spicyweb\fieldlabels\Plugin as FieldLabels;

/**
 * m200812_104254_craft_3_5_field_layout_transition_part_2 migration.
 *
 * @package spicyweb\fieldlabels\migrations
 * @author Spicy Web <plugins@spicyweb.com.au>
 * @since 1.3.1
 */
class m200812_104254_craft_3_5_field_layout_transition_part_2 extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp()
    {
        $fieldsService = Craft::$app->getFields();
        $oldLabels = FieldLabels::$plugin->methods->getAllLabels();
        $labels = [];
        $layouts = [];
        $fields = [];
        $anyLayoutUpdated = false;

        // Re-index the labels by layout/field UIDs, so we can easily look them up when updating the layouts
        foreach ($oldLabels as $label) {
            if (!isset($layouts[$label->fieldLayoutId])) {
                $layouts[$label->fieldLayoutId] = $fieldsService->getLayoutById($label->fieldLayoutId);
            }

            $layoutUid = $layouts[$label->fieldLayoutId]->uid;
            $fieldUid = $fields[$label->fieldId] ?? Db::uidById('{{%fields}}', $label->fieldId);
            $labels[$layoutUid][$fieldUid] = $label;

            if (!isset($fields[$label->fieldId])) {
                $fields[$label->fieldId] = $fieldUid;
            }
        }

        // No need for these anymore
        unset($oldLabels, $fields);

        foreach ($layouts as $layout) {
            $layoutUpdated = false;

            foreach ($layout->getTabs() as $tab) {
                foreach ($tab->elements as &$tabElement) {
                    // Clearly only fields will have Field Labels data
                    if (!($tabElement instanceof CustomField)) {
                        continue;
                    }

                    $label = $labels[$layout->uid][$tabElement->fieldUid] ?? null;

                    // No label or hideName for this layout/field, nothing to do here
                    if ($label === null || !$label->hideName) {
                        continue;
                    }

                    if (!$layoutUpdated) {
                        $layoutUpdated = true;
                    }

                    $tabElement->label = $label->hideName ? '__blank__' : $label->name;
                }
            }

            // No need to resave the layout if we never updated any elements
            if ($layoutUpdated) {
                $fieldsService->saveLayout($layout);

                if (!$anyLayoutUpdated) {
                    $anyLayoutUpdated = true;
                }
            }
        }

        if ($anyLayoutUpdated) {
            Craft::$app->getProjectConfig()->rebuild();
        }
    }

    /**
     * @inheritdoc
     */
    public function safeDown()
    {
        echo "m200812_104254_craft_3_5_field_layout_transition_part_2 cannot be reverted.\n";
        return false;
    }
}
