// 通用类型定义

import { SIZES, STATES, EXPORT_FORMATS, MOBILE_TAB_VALUES } from "@/constants";

export type Size = (typeof SIZES)[keyof typeof SIZES];

export type State = (typeof STATES)[keyof typeof STATES];

export type ExportFormat = (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];

export type MobileTabValue = (typeof MOBILE_TAB_VALUES)[keyof typeof MOBILE_TAB_VALUES];
