<?php

namespace spicyweb\fieldlabels\migrations;

use Craft;
use craft\db\Migration;

/**
 * m190517_093540_hide_field_headings migration.
 *
 * @package spicyweb\fieldlabels\migrations
 * @author Spicy Web <craft@spicyweb.com.au>
 * @since 1.1.2
 */
class m190517_093540_hide_field_headings extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp()
    {
        $this->addColumn('{{%fieldlabels}}', 'hideName', $this->boolean()->notNull()->after('instructions')->defaultValue(false));
        $this->addColumn('{{%fieldlabels}}', 'hideInstructions', $this->boolean()->notNull()->after('hideName')->defaultValue(false));
    }

    /**
     * @inheritdoc
     */
    public function safeDown()
    {
        echo "m190517_093540_hide_field_headings cannot be reverted.\n";
        return false;
    }
}
