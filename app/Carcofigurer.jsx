'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Header from './components/Header';

const CarConfigurator = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPowertrain, setSelectedPowertrain] = useState('');
  const [selectedTrim, setSelectedTrim] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedColor, setSelectedColor] = useState('');
  const [carData, setCarData] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // JSON 파일 로딩 함수
  const loadCarData = async (category) => {
    setLoading(true);
    try {
      // 실제 구현에서는 fetch를 사용하여 JSON 파일을 불러옵니다
      const response = await fetch(`/data/${category}.json`);
      const data = await response.json();
      
      if (data) {
        setCarData(data);
        setJsonInput(JSON.stringify(data, null, 2));
      }
      
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
      setCarData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (carData && selectedModel && selectedPowertrain && selectedTrim) {
      const currentConfig = {
        category: selectedCategory,
        model: selectedModel,
        powertrain: selectedPowertrain,
        trim: selectedTrim,
        color: selectedColor,
        options: selectedOptions,
        pricing: calculatePricing()
      };
      setJsonOutput(JSON.stringify(currentConfig, null, 2));
    }
  }, [selectedCategory, selectedModel, selectedPowertrain, selectedTrim, selectedColor, selectedOptions]);

  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    setSelectedModel('');
    setSelectedPowertrain('');
    setSelectedTrim('');
    setSelectedColor('');
    setSelectedOptions({});
    
    // 선택된 카테고리의 JSON 파일 로드
    await loadCarData(category);
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    setSelectedPowertrain('');
    setSelectedTrim('');
    setSelectedColor('');
    setSelectedOptions({});
  };

  const handlePowertrainChange = (powertrain) => {
    setSelectedPowertrain(powertrain);
    setSelectedTrim('');
    setSelectedColor('');
    setSelectedOptions({});
  };

  const handleTrimChange = (trim) => {
    setSelectedTrim(trim);
    setSelectedColor('');
    // 기본 선택된 옵션들을 설정
    const trimData = carData[selectedModel][selectedPowertrain][trim];
    const defaultOptions = {};
    Object.entries(trimData.옵션).forEach(([key, value]) => {
      if (value.value === true) {
        defaultOptions[key] = true;
      }
    });
    setSelectedOptions(defaultOptions);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  // 옵션 선택 가능 여부 확인
  const isOptionAvailable = (optionName, optionData) => {
    // 기본 포함이면 항상 사용 가능
    if (optionData.value === true) return true;
    
    // 선택 불가면 사용 불가
    if (optionData.value === false) return false;
    
    // requires가 있으면 조건 확인
    if (optionData.requires) {
      return optionData.requires.every(req => {
        const reqOption = carData[selectedModel][selectedPowertrain][selectedTrim].옵션[req];
        // 기본 포함이거나 선택된 옵션
        return reqOption.value === true || selectedOptions[req];
      });
    }
    
    return true;
  };

  const handleOptionChange = (optionName, checked) => {
    const trimData = carData[selectedModel][selectedPowertrain][selectedTrim];
    const optionData = trimData.옵션[optionName];
    
    // 기본 포함 옵션은 변경 불가
    if (optionData.value === true) return;
    
    // 선택 불가 옵션은 변경 불가
    if (optionData.value === false) return;
    
    // 체크할 때 의존성 확인
    if (checked && !isOptionAvailable(optionName, optionData)) {
      const missingRequirements = optionData.requires.filter(req => {
        const reqOption = carData[selectedModel][selectedPowertrain][selectedTrim].옵션[req];
        return reqOption.value !== true && !selectedOptions[req];
      });
      alert(`이 옵션을 선택하려면 먼저 다음 옵션들을 선택해야 합니다: ${missingRequirements.join(', ')}`);
      return;
    }
    
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: checked
    }));
  };

  const calculatePricing = () => {
    if (!carData || !selectedModel || !selectedPowertrain || !selectedTrim) {
      return { base: 0, options: 0, color: 0, total: 0 };
    }

    const trimData = carData[selectedModel][selectedPowertrain][selectedTrim];
    const basePrice = trimData.가격 * 10000; // 만원 단위를 원 단위로 변환
    let optionsPrice = 0;
    let colorPrice = 0;

    // 옵션 가격 계산
    Object.entries(selectedOptions).forEach(([optionName, selected]) => {
      if (selected && trimData.옵션[optionName]) {
        const optionData = trimData.옵션[optionName];
        let optionPrice = 0;
        
        if (typeof optionData.value === 'number') {
          optionPrice = optionData.value;
        }
        
        // conditional 로직 처리
        if (optionData.conditional && Array.isArray(optionData.conditional)) {
          for (const condition of optionData.conditional) {
            if (condition.requires && condition.requires.every(req => selectedOptions[req])) {
              optionPrice = condition.value;
              break;
            }
          }
        }
        
        optionsPrice += optionPrice * 10000; // 만원 단위를 원 단위로 변환
      }
    });

    // 색상 가격 계산
    if (selectedColor && carData[selectedModel][selectedPowertrain]["색상"] && carData[selectedModel][selectedPowertrain]["색상"][selectedColor]) {
      const colorData = carData[selectedModel][selectedPowertrain]["색상"][selectedColor];
      if (typeof colorData.value === 'number') {
        colorPrice = colorData.value * 10000; // 만원 단위를 원 단위로 변환
      }
    }

    return {
      base: basePrice,
      options: optionsPrice,
      color: colorPrice,
      total: basePrice + optionsPrice + colorPrice
    };
  };

  // 옵션 정렬 함수: 기본 -> 선택 -> 선택불가 순
  const sortOptions = (options) => {
    return Object.entries(options).sort(([aName, aData], [bName, bData]) => {
      // 기본 포함 (value === true)
      if (aData.value === true && bData.value !== true) return -1;
      if (bData.value === true && aData.value !== true) return 1;
      
      // 선택 불가 (value === false)
      if (aData.value === false && bData.value !== false) return 1;
      if (bData.value === false && aData.value !== false) return -1;
      
      // 같은 카테고리 내에서는 이름순 정렬
      return aName.localeCompare(bName);
    });
  };

  const handleJsonInputChange = (value) => {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value);
      setCarData(parsed);
    } catch (e) {
      // JSON 파싱 에러는 무시 (사용자가 입력 중일 수 있음)
    }
  };

  // JSON 다운로드 함수
  const downloadJson = (data, filename) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatPrice = (price) => {
    return `₩${price.toLocaleString()}`;
  };

  const pricing = calculatePricing();

  return (
    <div className="min-h-screen bg-gray-50">
      
      <Header selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        {selectedCategory && (
          <div className="bg-white rounded-lg border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  selectedCategory ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>1</div>
                <span className={`font-medium ${selectedCategory ? 'text-green-600' : 'text-gray-400'}`}>
                  카테고리: {selectedCategory || '선택안됨'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  selectedModel ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>2</div>
                <span className={`font-medium ${selectedModel ? 'text-green-600' : 'text-gray-400'}`}>
                  모델: {selectedModel || '선택안됨'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  selectedPowertrain ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>3</div>
                <span className={`font-medium ${selectedPowertrain ? 'text-green-600' : 'text-gray-400'}`}>
                  파워트레인: {selectedPowertrain || '선택안됨'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  selectedTrim ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>4</div>
                <span className={`font-medium ${selectedTrim ? 'text-green-600' : 'text-gray-400'}`}>
                  트림: {selectedTrim || '선택안됨'}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  selectedColor ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>5</div>
                <span className={`font-medium ${selectedColor ? 'text-green-600' : 'text-gray-400'}`}>
                  색상: {selectedColor || '선택안됨'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Summary Card */}
        {selectedTrim && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedModel} {selectedPowertrain} {selectedTrim}
                  {selectedColor && <span className="text-lg text-gray-600 ml-2">({selectedColor})</span>}
                </h2>
                <p className="text-gray-600">선택된 옵션 {Object.values(selectedOptions).filter(Boolean).length}개</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">예상 총액</p>
                <p className="text-3xl font-bold text-blue-600">{formatPrice(pricing.total)}</p>
                <p className="text-sm text-gray-500">
                  기본가 {formatPrice(pricing.base)} + 옵션 {formatPrice(pricing.options)} + 색상 {formatPrice(pricing.color)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">데이터 로딩 중...</div>
          </div>
        )}

        {/* No Category Selected */}
        {!selectedCategory && !loading && (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-600">카테고리를 선택해주세요</h3>
          </div>
        )}

        {/* Main Content */}
        {selectedCategory && carData && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-1 gap-6">
            {/* Step 1: Model Selection - Row 1 spanning all columns */}
            <div className="bg-white rounded-lg border shadow-sm lg:col-span-4 lg:row-start-1">
              <div className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-2">1</span>
                    모델 선택
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.keys(carData).map(model => (
                      <label key={model} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedModel === model ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                      }`}>
                        <input
                          type="radio"
                          name="model"
                          value={model}
                          checked={selectedModel === model}
                          onChange={(e) => handleModelChange(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className={`font-medium ${selectedModel === model ? 'text-blue-700' : 'text-gray-700'}`}>
                          {model}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Powertrain Selection - Row 2, Col 1 */}
            <div className={`bg-white rounded-lg border shadow-sm lg:col-start-1 lg:row-start-2 ${!selectedModel ? 'opacity-50' : ''}`}>
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-2">2</span>
                  파워트레인
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {selectedModel && carData[selectedModel] ? (
                  Object.keys(carData[selectedModel]).map(powertrain => (
                    <label key={powertrain} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedPowertrain === powertrain ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}>
                      <input
                        type="radio"
                        name="powertrain"
                        value={powertrain}
                        checked={selectedPowertrain === powertrain}
                        onChange={(e) => handlePowertrainChange(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={`font-medium ${selectedPowertrain === powertrain ? 'text-blue-700' : 'text-gray-700'}`}>
                        {powertrain}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">모델을 먼저 선택하세요</p>
                )}
              </div>
            </div>

            {/* Step 3: Trim Selection - Row 3, Col 1 */}
            <div className={`bg-white rounded-lg border shadow-sm lg:col-start-1 lg:row-start-3 ${!selectedPowertrain ? 'opacity-50' : ''}`}>
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-2">3</span>
                  트림 선택
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {selectedPowertrain && carData[selectedModel] ? (
                  Object.keys(carData[selectedModel][selectedPowertrain]).filter(key => key !== '색상').map(trim => (
                    <label key={trim} className={`flex flex-col p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTrim === trim ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="trim"
                          value={trim}
                          checked={selectedTrim === trim}
                          onChange={(e) => handleTrimChange(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className={`font-medium ${selectedTrim === trim ? 'text-blue-700' : 'text-gray-700'}`}>
                          {trim}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 ml-7 mt-1">
                        {formatPrice(carData[selectedModel][selectedPowertrain][trim].가격 * 10000)}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">파워트레인을 먼저 선택하세요</p>
                )}
              </div>
            </div>

            {/* Step 4: Color Selection - Row 4, Col 1 */}
            <div className={`bg-white rounded-lg border shadow-sm lg:col-start-1 lg:row-start-4 ${!selectedTrim ? 'opacity-50' : ''}`}>
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-2">4</span>
                  색상 선택
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {selectedTrim && carData[selectedModel] && carData[selectedModel][selectedPowertrain]["색상"] ? (
                  <>
                    <label className={`flex flex-col p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                      !selectedColor ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="color"
                          value=""
                          checked={!selectedColor}
                          onChange={(e) => handleColorChange('')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className={`font-medium ${!selectedColor ? 'text-blue-700' : 'text-gray-700'}`}>
                          기본 색상
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 ml-7 mt-1">
                        추가 비용 없음
                      </span>
                    </label>
                    {Object.entries(carData[selectedModel][selectedPowertrain]["색상"]).map(([color, colorData]) => (
                      <label key={color} className={`flex flex-col p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedColor === color ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="color"
                            value={color}
                            checked={selectedColor === color}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className={`font-medium ${selectedColor === color ? 'text-blue-700' : 'text-gray-700'}`}>
                            {color}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 ml-7 mt-1">
                          +{formatPrice(colorData.value * 10000)}
                        </span>
                      </label>
                    ))}
                  </>
                ) : selectedTrim ? (
                  <p className="text-gray-400 text-center py-8">색상 선택 없음</p>
                ) : (
                  <p className="text-gray-400 text-center py-8">트림을 먼저 선택하세요</p>
                )}
              </div>
            </div>

            {/* Step 5: Options - Rows 2-4, Cols 2-4 */}
            <div className={`bg-white rounded-lg border shadow-sm lg:col-start-2 lg:col-span-3 lg:row-start-2 lg:row-span-3 ${!selectedTrim ? 'opacity-50' : ''}`}>
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-2">5</span>
                  옵션 선택
                </h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {selectedTrim && carData[selectedModel] ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortOptions(carData[selectedModel][selectedPowertrain][selectedTrim].옵션).map(([optionName, optionData]) => {
                      const isIncluded = optionData.value === true;
                      const isDisabled = optionData.value === false;
                      const isAvailable = isOptionAvailable(optionName, optionData);
                      const optionPrice = typeof optionData.value === 'number' ? optionData.value : 0;
                      
                      return (
                        <label 
                          key={optionName} 
                          className={`flex flex-col p-3 rounded-lg border transition-colors ${
                            isIncluded ? 'bg-blue-50 border-blue-300 cursor-default' :
                            isDisabled ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' : 
                            !isAvailable ? 'bg-red-50 border-red-200 opacity-75 cursor-not-allowed' :
                            selectedOptions[optionName] ? 'bg-green-50 border-green-300 cursor-pointer' : 
                            'border-gray-200 cursor-pointer hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedOptions[optionName] || isIncluded}
                              onChange={(e) => handleOptionChange(optionName, e.target.checked)}
                              disabled={isIncluded || isDisabled || !isAvailable}
                              className="w-4 h-4 text-green-600 mt-0.5"
                            />
                            <div className="flex-1">
                              <span className={`font-medium text-sm ${
                                isIncluded ? 'text-blue-700' :
                                selectedOptions[optionName] ? 'text-green-700' : 'text-gray-700'
                              }`}>
                                {optionName}
                              </span>
                              {optionData.requires && (
                                <div className="text-xs text-gray-500 mt-1">
                                  필요: {optionData.requires.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-7 mt-1">
                            <span className="text-xs font-medium">
                              {isIncluded ? (
                                <span className="text-blue-600">기본 포함</span>
                              ) : isDisabled ? (
                                <span className="text-gray-400">선택 불가</span>
                              ) : !isAvailable ? (
                                <span className="text-red-600">조건 미충족</span>
                              ) : (
                                <span className="text-blue-600">+{formatPrice(optionPrice * 10000)}</span>
                              )}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">트림을 먼저 선택하세요</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* JSON Section - 선택이 완료된 경우만 표시 */}
        {selectedTrim && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* JSON Input */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">데이터 입력 (JSON)</h3>
                <button
                  onClick={() => downloadJson(jsonInput, 'car-data-input.json')}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <Download size={16} />
                  <span>다운로드</span>
                </button>
              </div>
              <div className="p-4">
                <textarea
                  value={jsonInput}
                  onChange={(e) => handleJsonInputChange(e.target.value)}
                  className="w-full h-40 p-3 border rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="JSON 데이터를 입력하세요..."
                />
              </div>
            </div>

            {/* JSON Output */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">구성 결과 (JSON)</h3>
                <button
                  onClick={() => downloadJson(jsonOutput, `car-config-${selectedModel}-${selectedTrim}.json`)}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  disabled={!jsonOutput}
                >
                  <Download size={16} />
                  <span>다운로드</span>
                </button>
              </div>
              <div className="p-4">
                <textarea
                  value={jsonOutput}
                  readOnly
                  className="w-full h-40 p-3 border rounded font-mono text-sm bg-gray-50"
                  placeholder="선택한 구성이 여기에 출력됩니다..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarConfigurator;