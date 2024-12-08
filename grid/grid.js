/*
    jqGrid: JavaScript 기반의 그리드 플러그인 (주로 jQuery 라이브러리와 함께 사용)
    https://www.trirand.com/blog/jqgrid/jqgrid.html

    [ jqGrid 메서드 ]
    * jqGrid(): jqGrid를 초기화하거나, 이미 초기화된 그리드에 특정 기능을 추가/수정
    * trigger(): 특정 이벤트를 수동으로 발생시켜 그리드의 동작을 강제로 실행하도록 함
        - setGridParam: 그리드 설정 값 변경
        - getGridParam: 그리드 설정 값 조회
        - reloadGrid: 그리드 데이터 새로고침
    
    [ 기타 사용한 API ]
    * detach(): DOM 요소 제거 (삭제된 요소의 데이터와 이벤트 핸들러는 유지)
    * unshift(): 배열의 맨 앞에 요소 추가
    * shift(): 배열의 첫 번째 요소 제거
    * closest(): 현재 요소에서 가장 가까운 상위 요소 검색

    [ 구현한 기능 ]
    * Editable 옵션
    * 순번 옵션
    * 정렬 옵션 (ASC, DESC)
    * 선택 유형 옵션 (Single, Multi, None)
    * 말줄임표 옵션
    * 전체 건 수 표시 옵션
    * 페이징 옵션
 */

$(document).ready(function () {
    const grid = $("#grid");

    // 기본 colNames 설정
    let colNames = ['아이디', '제목', '내용'];

    // 기본 colModel 설정
    let colModel = [
        {name: 'UserId', index: 'UserId', width: 100, editable: true},
        {name: 'title', index: 'title', width: 200, editable: true},
        {name: 'content', index: 'content', width: 300, editable: true}
    ];
    
    // 비동기로 데이터 읽어와 dataList에 저장
    let dataList = [];
    $.ajax({
        url: 'https://koreanjson.com/posts',    // 데이터 URL
        datatype: 'json',                       // 데이터 타입
        success: function(data) {
            dataList = data;
            createGrid();
        }
    });

    // Editable 옵션
    $('#gridEditableYn input[type=radio]').on('change', function() {
        let isEditable = $(this).val() === 'Y';
        if (isEditable) {
            grid.jqGrid('setGridParam', {cellEdit: true});
        } else {
            grid.jqGrid('setGridParam', {cellEdit: false});
        }
        grid.trigger('reloadGrid'); // 데이터 새로고침
    });

    // 순번 옵션
    $('#rowNumY').on('change', function() {
        let rowNumOrder = $('#rowNumOrder');
        if ($(this).is(':checked')) {
            grid.jqGrid('showCol', 'rn');   // 순번 칼럼 표시
            rowNumOrder.show();             // 정렬 옵션 표시
        } else {
            grid.jqGrid('hideCol', 'rn');   // 순번 칼럼 숨김
            rowNumOrder.hide();             // 정렬 옵션 숨김
            // 정렬 옵션 오름차순 설정
            $('#rowNumOrder input[type=radio][value="asc"]').trigger('click');
        }
    });

    // 정렬 옵션
    $('#rowNumOrder input[type=radio]').on('click', function() {
        let rowNumOrder = $(this).val();
        let tbody = grid.find('tbody');
        let rows = tbody.find('tr.jqgrow'); // 데이터 행

        // 현재 데이터를 배열로 수집
        let rowsData = [];
        rows.each(function() {
            let rownumCell = $(this).find('td[aria-describedby$="_rn"]');
            let value = parseInt(rownumCell.text(), 10); // 순번 텍스트를 정수로 변환
            rowsData.push({
                element: $(this),
                value: value
            });
        });

        // 데이터 정렬
        rowsData.sort(function(a, b) {
            return rowNumOrder === 'asc' ? a.value - b.value : b.value - a.value;
        });

        // DOM 요소 제거
        rows.detach();

        // 정렬된 순서대로 행을 다시 추가
        rowsData.forEach(function(row) {
            tbody.append(row.element);
        });
    });

    // 선택 유형 옵션
    $('input[name="selectType"]').on('change', function() {
        setSelectType($(this).val());
    });

    // 선택 유형 설정 함수
    function setSelectType(type){
        // 이전에 Single 옵션을 선택한 경우 선택 유형 칼럼 제거
        if (colNames.includes('')) {
            colNames.shift();
            colModel.shift();
        }
        // Multi 옵션
        if (type === 'checkbox') {
            createGrid(true);
            return;
        }
        // None 옵션
        if (type === 'none') {
            createGrid(false);
            return;
        }
        
        // Single 옵션
        colNames.unshift(''); // 선택 유형 칼럼 헤더 추가
        // 선택 유형 칼럼 모델 추가
        colModel.unshift({ 
            name: 'selectType', 
            index: 'selectType', 
            width: '20px',
            align: 'center',
            formatter: function(cellvalue, options, rowObject) {
                return `<input type="${type}" name="selectRow" value="${options.rowId}">`;
            }
        });
        createGrid(false); // 그리드 재생성
    
        // Single 데이터 행 선택 시 highlight 클래스 추가
        $("input[name='selectRow']").on('change', function() {
            const tr = $(this).closest('tr'); // 선택한 데이터 행의 가장 가까운 tr 요소
            $('tr.ui-state-highlight').removeClass('ui-state-highlight'); // 기존 highlight 클래스 제거
            if ($(this).is(':checked')) {
                tr.addClass('ui-state-highlight');
            }
        });
    }

    // 말줄임표 옵션
    $('#ellipsisY').on('change', function() {
        if ($(this).is(':checked')) {
            $('td[role="gridcell"]').addClass('ellipsis');
        } else {
            $('td[role="gridcell"]').removeClass('ellipsis');
        }
    });
    
    // 전체 건 수 표시 옵션
    $('#totalCountYnY').on('change', function() {
        showPageInfo();
    });

    // 페이징 옵션
    $('#pagingYnY').on('change', function() {
        showPageInfo();
    });

    // 페이지 정보 표시 함수
    function showPageInfo() {
        let totalCount = grid.jqGrid('getGridParam', 'records');    // 전체 건 수
        let totalPages = grid.jqGrid('getGridParam', 'lastpage');   // 총 페이지 수
        let currentPage = grid.jqGrid('getGridParam', 'page');      // 현재 페이지 번호
        
        if ($('#totalCountYnY').is(':checked')) {
            if ($('#pagingYnY').is(':checked')) { // 페이징 사용
                $('.page-info').html(`전체 <span class="total-count">${totalCount}</span> ( ${currentPage} / ${totalPages} )`);
            } else { // 페이징 미사용
                $('.page-info').html(`전체 <span class="total-count">${totalCount}</span>`);
            }
        } else {
            $('.page-info').text('');
        }
    }

    // 그리드 생성 함수
    function createGrid(multiSelect = false) {
        const newDataList = [...dataList];  // 그리드 데이터 원본 복사
        grid.jqGrid('GridUnload');          // 기존 그리드 제거
        grid.jqGrid({
            datatype: 'local',
            data: newDataList,
            colNames: colNames,
            colModel: colModel,
            autowidth: true,            // 그리드 너비를 컨테이너 요소에 맞춰 자동 조절
            forceFit: true,             // 칼럼 너비 조절 시 다른 칼럼 너비도 자동 조정
            loadonce: true,             // 데이터를 한 번만 로드
            cellEdit: true,             // 그리드 셀 편집 가능
            rownumbers: true,           // 순번
            rownumWidth: 40,            // 순번 너비
            multiselect: multiSelect,   // 다중 선택 활성화
            multiselectWidth: '50px',   // multiselect 칼럼 너비
            loadComplete: function(data) {
                if (!$('#rowNumY').is(':checked')) {
                    $(this).jqGrid('hideCol', 'rn');
                }
            }
        });
        dataList = newDataList; // 복사한 데이터를 원본 데이터로 변경
    }
});