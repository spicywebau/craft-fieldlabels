<?php
namespace spicyweb\fieldlabels\records;

use yii\db\ActiveQueryInterface;

use craft\db\ActiveRecord;

/**
 * Class FieldLabel
 *
 * @package spicyweb\fieldlabels\records
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class FieldLabel extends ActiveRecord
{
	/**
	 * @inheritdoc
	 */
	public static function tableName(): string
	{
		return '{{%fieldlabels}}';
	}

	/**
	 * @inheritdoc
	 */
	public function rules()
	{
		return [
			[['name', 'instructions'], 'required'],
			[['name', 'instructions'], 'string', 'max' => 255],
		];
	}
}
